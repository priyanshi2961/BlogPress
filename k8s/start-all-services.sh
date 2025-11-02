#!/bin/bash

# One-stop script to start all BlogPress port-forwards with monitoring

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting BlogPress Port-Forward Manager"
echo ""

# Kill any existing monitors
if pgrep -f "keep-port-forwards-alive" > /dev/null; then
    echo "Stopping existing monitor..."
    pkill -f "keep-port-forwards-alive"
    sleep 2
fi

# Create log directory first
mkdir -p /tmp/blogpress-port-forwards

# Start the persistent monitor
echo "Starting persistent port-forward monitor..."
nohup "$SCRIPT_DIR/keep-port-forwards-alive.sh" > /tmp/blogpress-port-forwards/manager.log 2>&1 &

sleep 3

# Check if it started
if pgrep -f "keep-port-forwards-alive" > /dev/null; then
    echo "✅ Port-forward manager started successfully!"
    echo ""
    echo "Services should be accessible at:"
    echo "  Frontend:    http://localhost:30966"
    echo "  API Gateway: http://localhost:8084"
    echo ""
    echo "The manager will automatically restart port-forwards if they die."
    echo ""
    echo "To stop the manager: ./k8s/stop-port-forwards.sh"
    echo "Logs: /tmp/blogpress-port-forwards/"
else
    echo "❌ Failed to start port-forward manager"
    exit 1
fi

