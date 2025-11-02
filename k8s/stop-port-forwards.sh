#!/bin/bash

# Stop all BlogPress port-forwards and the monitor

echo "Stopping BlogPress port-forwards..."

# Stop the monitor
if pgrep -f "keep-port-forwards-alive" > /dev/null; then
    echo "Stopping port-forward monitor..."
    pkill -f "keep-port-forwards-alive"
    sleep 2
fi

# Stop individual port-forwards
echo "Stopping individual port-forwards..."
pkill -f "port-forward.*blog-frontend"
pkill -f "port-forward.*api-gateway"

# Kill any processes on the ports
lsof -ti:30966 | xargs kill -9 2>/dev/null
lsof -ti:8084 | xargs kill -9 2>/dev/null

echo "✅ All port-forwards stopped"

