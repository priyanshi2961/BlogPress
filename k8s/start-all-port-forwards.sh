#!/bin/bash
# Script to start all required port-forwards for BlogPress

echo "Starting port-forwards for BlogPress services..."

# Kill existing port-forwards
pkill -f "port-forward.*blog-frontend" 2>/dev/null
pkill -f "port-forward.*api-gateway" 2>/dev/null

# Start frontend port-forward
echo "Starting frontend port-forward (30966)..."
kubectl port-forward svc/blog-frontend 30966:80 -n blogpress --address=127.0.0.1 > /tmp/frontend-pf.log 2>&1 &

# Start API Gateway port-forward  
echo "Starting API Gateway port-forward (8084)..."
kubectl port-forward svc/api-gateway 8084:8084 -n blogpress --address=127.0.0.1 > /tmp/api-gateway-pf.log 2>&1 &

sleep 3
echo ""
echo "✅ Port-forwards started!"
echo "Frontend: http://localhost:30966"
echo "API Gateway: http://localhost:8084"
echo ""
echo "To check status: ps aux | grep port-forward"
echo "To stop: pkill -f port-forward"
