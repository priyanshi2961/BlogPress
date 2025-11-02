#!/bin/bash

# Find the frontend service
FRONTEND_SERVICE="blog-frontend"
NAMESPACE="blogpress"
LOCAL_PORT="30966"
TARGET_PORT="80"

echo "Starting port-forward for $FRONTEND_SERVICE to $LOCAL_PORT:$TARGET_PORT..."

# Kill any existing port-forward for this port
PID=$(lsof -t -i:$LOCAL_PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
  echo "Killing existing process on port $LOCAL_PORT (PID: $PID)"
  kill -9 $PID
  sleep 1
fi

# Also kill any kubectl port-forward processes for this service
pkill -f "port-forward.*$FRONTEND_SERVICE" 2>/dev/null
sleep 1

# Start the new port-forward in the background
nohup kubectl port-forward svc/$FRONTEND_SERVICE $LOCAL_PORT:$TARGET_PORT -n $NAMESPACE --address=127.0.0.1 > /tmp/frontend-pf.log 2>&1 &
echo "Port-forward started for $FRONTEND_SERVICE on 127.0.0.1:$LOCAL_PORT"
echo "Access frontend at http://localhost:$LOCAL_PORT"
echo ""
echo "To stop the port-forward, run: pkill -f 'port-forward.*$FRONTEND_SERVICE'"
