# Port-Forward Management

## Problem
Port-forwards in Kubernetes can stop unexpectedly, causing the frontend and API Gateway to become inaccessible.

## Solution
We've created a persistent port-forward manager that automatically monitors and restarts port-forwards if they die.

## Usage

### Start All Services (Recommended)
```bash
./k8s/start-all-services.sh
```

This will:
- Start port-forwards for Frontend (port 30966) and API Gateway (port 8084)
- Start a background monitor that automatically restarts them if they die
- Run continuously until stopped

### Stop All Services
```bash
./k8s/stop-port-forwards.sh
```

### Manual Control

#### Start Persistent Monitor
```bash
./k8s/keep-port-forwards-alive.sh
```

#### Start Individual Port-Forwards
```bash
# Frontend
./k8s/start-frontend-port-forward.sh

# API Gateway
./k8s/start-api-gateway-port-forward.sh
```

## How It Works

1. **Port-Forward Manager**: The `keep-port-forwards-alive.sh` script runs in the background
2. **Monitoring**: Checks every 10 seconds if port-forwards are running
3. **Auto-Restart**: Automatically restarts any port-forward that has died
4. **Logging**: All activity is logged to `/tmp/blogpress-port-forwards/`

## Logs

Check logs for troubleshooting:
```bash
# Frontend logs
tail -f /tmp/blogpress-port-forwards/frontend-pf.log

# API Gateway logs
tail -f /tmp/blogpress-port-forwards/api-gateway-pf.log

# Manager logs
tail -f /tmp/blogpress-port-forwards/manager.log
```

## Services

- **Frontend**: http://localhost:30966
- **API Gateway**: http://localhost:8084

## Troubleshooting

If services are still not accessible:

1. Check if monitor is running:
   ```bash
   pgrep -f keep-port-forwards-alive
   ```

2. Restart the manager:
   ```bash
   ./k8s/stop-port-forwards.sh
   ./k8s/start-all-services.sh
   ```

3. Check pod status:
   ```bash
   kubectl get pods -n blogpress -l 'app in (blog-frontend,api-gateway)'
   ```
