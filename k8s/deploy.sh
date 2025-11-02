#!/bin/bash

set -e

echo "🚀 Deploying BlogPress to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not accessible. Please ensure Kubernetes is running in Docker Desktop."
    exit 1
fi

echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

echo "🔐 Creating secrets..."
kubectl apply -f secrets.yaml

echo "📝 Creating MySQL ConfigMap..."
kubectl apply -f mysql-configmap.yaml

echo "🗄️  Deploying MySQL..."
kubectl apply -f mysql.yaml

echo "⏳ Waiting for MySQL to be ready (this may take a minute)..."
kubectl wait --for=condition=ready pod -l app=mysql -n blogpress --timeout=300s || {
    echo "⚠️  MySQL took too long to start. Check logs with: kubectl logs -l app=mysql -n blogpress"
}

echo "🔵 Deploying Eureka Server..."
kubectl apply -f eureka-server.yaml

echo "⏳ Waiting for Eureka Server to be ready..."
kubectl wait --for=condition=ready pod -l app=eureka-server -n blogpress --timeout=300s || {
    echo "⚠️  Eureka Server took too long to start. Check logs with: kubectl logs -l app=eureka-server -n blogpress"
}

echo "👤 Deploying User Service..."
kubectl apply -f user-service.yaml

echo "📝 Deploying Blog Service..."
kubectl apply -f blog-service.yaml

echo "💬 Deploying Engagement Service..."
kubectl apply -f engagement-service.yaml

echo "📧 Deploying Notification Service..."
kubectl apply -f notification-service.yaml

echo "🌐 Deploying API Gateway..."
kubectl apply -f api-gateway.yaml

echo "🎨 Deploying Frontend..."
kubectl apply -f frontend.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Checking pod status..."
kubectl get pods -n blogpress

echo ""
echo "🔍 To view services:"
echo "   kubectl get svc -n blogpress"
echo ""
echo "🔗 To access services, use port-forwarding:"
echo "   Frontend:     kubectl port-forward svc/blog-frontend 5173:80 -n blogpress"
echo "   API Gateway:  kubectl port-forward svc/api-gateway 8084:8084 -n blogpress"
echo "   Eureka:       kubectl port-forward svc/eureka-server 8761:8761 -n blogpress"
echo ""
echo "📖 See k8s/README.md for more details"

