#!/bin/bash

# Persistent port-forward manager for BlogPress services
# This script monitors and automatically restarts port-forwards if they die

FRONTEND_PORT="30966"
API_GATEWAY_PORT="8084"
NAMESPACE="blogpress"
LOG_DIR="/tmp/blogpress-port-forwards"
FRONTEND_LOG="$LOG_DIR/frontend-pf.log"
API_GATEWAY_LOG="$LOG_DIR/api-gateway-pf.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Function to check if port-forward is running
check_port_forward() {
    local service=$1
    local port=$2
    ps aux | grep -v grep | grep "port-forward.*$service.*$port" > /dev/null
    return $?
}

# Function to start port-forward
start_port_forward() {
    local service=$1
    local local_port=$2
    local target_port=$3
    local log_file=$4
    
    # Kill any existing port-forward for this port
    PID=$(lsof -t -i:$local_port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
    
    # Kill any kubectl port-forward processes for this service
    pkill -f "port-forward.*$service" 2>/dev/null
    sleep 1
    
    # Start the port-forward in the background
    nohup kubectl port-forward svc/$service $local_port:$target_port -n $NAMESPACE --address=127.0.0.1 > "$log_file" 2>&1 &
    
    # Wait a moment and verify it started
    sleep 2
    if check_port_forward "$service" "$local_port"; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Started port-forward for $service on port $local_port" | tee -a "$log_file"
        return 0
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Failed to start port-forward for $service" | tee -a "$log_file"
        return 1
    fi
}

# Function to monitor and restart port-forwards
monitor_port_forwards() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting port-forward monitor..." | tee -a "$FRONTEND_LOG" "$API_GATEWAY_LOG"
    
    while true; do
        # Check frontend port-forward
        if ! check_port_forward "blog-frontend" "$FRONTEND_PORT"; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Frontend port-forward died, restarting..." | tee -a "$FRONTEND_LOG"
            start_port_forward "blog-frontend" "$FRONTEND_PORT" "80" "$FRONTEND_LOG"
        fi
        
        # Check API Gateway port-forward
        if ! check_port_forward "api-gateway" "$API_GATEWAY_PORT"; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - API Gateway port-forward died, restarting..." | tee -a "$API_GATEWAY_LOG"
            start_port_forward "api-gateway" "$API_GATEWAY_PORT" "8084" "$API_GATEWAY_LOG"
        fi
        
        # Sleep for 10 seconds before checking again
        sleep 10
    done
}

# Check if monitor is already running
if pgrep -f "keep-port-forwards-alive" > /dev/null; then
    echo "Port-forward monitor is already running"
    exit 0
fi

# Start the monitor
echo "Starting persistent port-forward monitor..."
echo "This will run in the background and automatically restart port-forwards"
echo "Logs: $LOG_DIR/"
echo ""
echo "To stop, run: pkill -f keep-port-forwards-alive"

# Start initial port-forwards
start_port_forward "blog-frontend" "$FRONTEND_PORT" "80" "$FRONTEND_LOG"
start_port_forward "api-gateway" "$API_GATEWAY_PORT" "8084" "$API_GATEWAY_LOG"

# Start monitoring in background
monitor_port_forwards &

MONITOR_PID=$!
echo "Monitor PID: $MONITOR_PID"
echo "Monitor started. Port-forwards will be automatically restarted if they die."

# Save PID to file for easy stopping
echo $MONITOR_PID > "$LOG_DIR/monitor.pid"
echo "To stop: kill \$(cat $LOG_DIR/monitor.pid)"

wait $MONITOR_PID

