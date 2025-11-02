#!/bin/bash

# Find the API Gateway service
API_GATEWAY_SERVICE="api-gateway"
NAMESPACE="blogpress"
LOCAL_PORT="8084"
TARGET_PORT="8084"

echo "Starting port-forward for $API_GATEWAY_SERVICE to $LOCAL_PORT:$TARGET_PORT..."

# Kill any existing port-forward for this port
PID=$(lsof -t -i:$LOCAL_PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
  echo "Killing existing process on port $LOCAL_PORT (PID: $PID)"
  kill -9 $PID
  sleep 1
fi

# Also kill any kubectl port-forward processes for this service
pkill -f "port-forward.*$API_GATEWAY_SERVICE" 2>/dev/null
sleep 1

# Start the new port-forward in the background
nohup kubectl port-forward svc/$API_GATEWAY_SERVICE $LOCAL_PORT:$TARGET_PORT -n $NAMESPACE --address=127.0.0.1 > /tmp/api-gateway-pf.log 2>&1 &
echo "Port-forward started for $API_GATEWAY_SERVICE on 127.0.0.1:$LOCAL_PORT"
echo "Access API Gateway at http://localhost:$LOCAL_PORT"
echo ""
echo "To stop the port-forward, run: pkill -f 'port-forward.*$API_GATEWAY_SERVICE'"
