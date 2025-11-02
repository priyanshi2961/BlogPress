# BlogPress Kubernetes Deployment Guide

This directory contains Kubernetes manifests to deploy BlogPress microservices to Kubernetes (Docker Desktop).

## Prerequisites

1. **Kubernetes enabled in Docker Desktop**:
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Enable Kubernetes
   - Click "Apply & Restart"

2. **kubectl installed** (included with Docker Desktop)

3. **Docker images built locally**:
   ```bash
   docker compose build
   ```
   This builds all images with names like `blogpress-master2-*-service:latest`

## Deployment Steps

### 1. Create Namespace and Secrets
```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f mysql-configmap.yaml
```

### 2. Deploy MySQL Database
```bash
kubectl apply -f mysql.yaml
```
Wait for MySQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=mysql -n blogpress --timeout=300s
```

### 3. Deploy Eureka Server
```bash
kubectl apply -f eureka-server.yaml
```
Wait for Eureka to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=eureka-server -n blogpress --timeout=300s
```

### 4. Deploy Microservices
```bash
kubectl apply -f user-service.yaml
kubectl apply -f blog-service.yaml
kubectl apply -f engagement-service.yaml
kubectl apply -f notification-service.yaml
```

### 5. Deploy API Gateway
```bash
kubectl apply -f api-gateway.yaml
```

### 6. Deploy Frontend
```bash
kubectl apply -f frontend.yaml
```

### 7. (Optional) Deploy Ingress
If you have an Ingress controller (e.g., NGINX Ingress) installed:
```bash
kubectl apply -f ingress.yaml
```

## Quick Deploy (All at Once)

### Using the deployment script:
```bash
cd k8s
./deploy.sh
```

### Or manually:
```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f mysql-configmap.yaml
kubectl apply -f mysql.yaml
kubectl wait --for=condition=ready pod -l app=mysql -n blogpress --timeout=300s
kubectl apply -f eureka-server.yaml
kubectl wait --for=condition=ready pod -l app=eureka-server -n blogpress --timeout=300s
kubectl apply -f user-service.yaml
kubectl apply -f blog-service.yaml
kubectl apply -f engagement-service.yaml
kubectl apply -f notification-service.yaml
kubectl apply -f api-gateway.yaml
kubectl apply -f frontend.yaml
```

## Accessing Services

### Using LoadBalancer Services (Docker Desktop)

1. **Get service IPs**:
   ```bash
   kubectl get svc -n blogpress
   ```

2. **Frontend**: http://localhost:<EXTERNAL-IP>
   ```bash
   kubectl get svc blog-frontend -n blogpress
   # Use EXTERNAL-IP from output, or port-forward:
   kubectl port-forward svc/blog-frontend 5173:80 -n blogpress
   # Access at http://localhost:5173
   ```

3. **API Gateway**: http://localhost:<EXTERNAL-IP>
   ```bash
   kubectl port-forward svc/api-gateway 8084:8084 -n blogpress
   # Access at http://localhost:8084
   ```

4. **Eureka Dashboard**: 
   ```bash
   kubectl port-forward svc/eureka-server 8761:8761 -n blogpress
   # Access at http://localhost:8761
   ```

### Using Ingress (if Ingress Controller is installed)

Add to `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1 blogpress.local
127.0.0.1 eureka.local
```

Then access:
- Frontend: http://blogpress.local
- API Gateway: http://blogpress.local/api
- Eureka: http://eureka.local

## Verifying Deployment

1. **Check all pods are running**:
   ```bash
   kubectl get pods -n blogpress
   ```

2. **Check services**:
   ```bash
   kubectl get svc -n blogpress
   ```

3. **Check Eureka registrations**:
   - Port-forward Eureka: `kubectl port-forward svc/eureka-server 8761:8761 -n blogpress`
   - Visit http://localhost:8761
   - All services should show UP status

4. **Check logs**:
   ```bash
   kubectl logs -f deployment/user-service -n blogpress
   kubectl logs -f deployment/api-gateway -n blogpress
   ```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n blogpress
kubectl logs <pod-name> -n blogpress
```

### Services not connecting
- Ensure Eureka is up first
- Check service DNS: `<service-name>.<namespace>.svc.cluster.local`
- Verify service selectors match pod labels

### MySQL connection issues
- Wait for MySQL to be fully ready
- Check MySQL logs: `kubectl logs statefulset/mysql -n blogpress`
- Verify secret is created: `kubectl get secret mysql-secret -n blogpress`

### Image pull errors
- Ensure images are built: `docker compose build`
- Verify image names match manifests (they use `imagePullPolicy: Never` for local images)
- If needed, tag images explicitly: `docker tag <image> <expected-name>`

### Frontend API connection issues
- The frontend uses `VITE_API_BASE` which is set at build time for Vite apps
- If the frontend can't reach the API Gateway, you may need to rebuild the frontend with the correct API base URL
- Or use port-forwarding for both frontend and API Gateway on the same machine:
  ```bash
  kubectl port-forward svc/blog-frontend 5173:80 -n blogpress &
  kubectl port-forward svc/api-gateway 8084:8084 -n blogpress &
  ```
  Then the frontend should work with API Gateway at `http://localhost:8084`

## Cleanup

To remove all resources:
```bash
kubectl delete namespace blogpress
```

Or delete individual resources:
```bash
kubectl delete -f frontend.yaml
kubectl delete -f api-gateway.yaml
kubectl delete -f notification-service.yaml
kubectl delete -f engagement-service.yaml
kubectl delete -f blog-service.yaml
kubectl delete -f user-service.yaml
kubectl delete -f eureka-server.yaml
kubectl delete -f mysql.yaml
kubectl delete -f mysql-configmap.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml
```

