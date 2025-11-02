# BlogPress CI/CD Pipeline

Production-ready CI/CD setup for BlogPress microservices using Jenkins, Docker, and Kubernetes.

## Directory Structure

```
ci-cd/
├── Jenkinsfile                          # Main Jenkins declarative pipeline
├── DOCUMENTATION.md                     # Comprehensive pipeline documentation
├── QUICK_START.md                       # Step-by-step setup guide
├── README.md                            # This file
│
├── helm-charts/
│   ├── microservice/                    # Reusable Helm chart
│   │   ├── Chart.yaml                   # Chart metadata
│   │   ├── values.yaml                  # Default values
│   │   └── templates/                   # Kubernetes manifests
│   │       ├── deployment.yaml          # Deployment template
│   │       ├── service.yaml             # Service template
│   │       ├── ingress.yaml             # Ingress template (optional)
│   │       ├── hpa.yaml                 # HorizontalPodAutoscaler (optional)
│   │       ├── pdb.yaml                 # PodDisruptionBudget (optional)
│   │       ├── serviceaccount.yaml      # ServiceAccount template
│   │       └── _helpers.tpl             # Template helpers
│   │
│   └── values/                          # Environment-specific values
│       ├── user-service-dev.yaml        # Dev values for user-service
│       ├── user-service-staging.yaml    # Staging values for user-service
│       └── user-service-prod.yaml       # Prod values for user-service
│
└── kubernetes/
    └── bootstrap/                       # Kubernetes bootstrap artifacts
        ├── namespaces.yaml              # Namespace definitions
        ├── service-accounts.yaml        # Service account definitions
        └── rbac.yaml                    # RBAC role and bindings
```

## Quick Reference

### Key Parameters

| Parameter | Location | Description |
|-----------|----------|-------------|
| `GLOBAL_REGISTRY` | Jenkinsfile environment block | Docker registry base URL |
| `REGISTRY_CREDENTIAL_ID` | Jenkinsfile environment block | Jenkins credential ID for registry |
| `KUBECONFIG_*_CREDENTIAL_ID` | Jenkinsfile environment block | Kubeconfig credential IDs per environment |
| `HELM_RELEASE_PREFIX` | Jenkinsfile environment block | Prefix for Helm releases |
| `SCAN_SEVERITY_THRESHOLD` | Jenkinsfile environment block | Vulnerability scanning severity threshold |

### Deployment Flow

1. **Push to branch** → Build → Deploy to `dev`
2. **Merge to main** → Build → Deploy to `staging`
3. **Tag v*** → Build → Manual approval → Deploy to `prod`

### Service Discovery

Services are auto-discovered from `./services/` directory. Each service must have:
- A `Dockerfile`
- Three values files in `helm-charts/values/` (one per environment)

## Getting Started

1. Read [QUICK_START.md](./QUICK_START.md) for setup instructions
2. Review [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed configuration
3. Customize values files for your services
4. Apply Kubernetes bootstrap artifacts
5. Configure Jenkins pipeline

## Adding a New Service

1. Create service directory: `./services/${SERVICE_NAME}/`
2. Add Dockerfile to service directory
3. Create three values files:
   - `helm-charts/values/${SERVICE_NAME}-dev.yaml`
   - `helm-charts/values/${SERVICE_NAME}-staging.yaml`
   - `helm-charts/values/${SERVICE_NAME}-prod.yaml`
4. Pipeline will auto-discover and include the service

## File Responsibilities

### Jenkinsfile
- Pipeline orchestration
- Service discovery
- Image versioning logic
- Build, scan, and deployment stages
- Quality gates and approvals

### Helm Chart (microservice/)
- Reusable deployment template
- Configurable via values files
- Supports all required Kubernetes resources
- Environment-specific customization

### Values Files
- Service-specific configuration
- Environment-specific settings
- Resource limits and requests
- Probe configuration
- Autoscaling settings
- Ingress configuration

### Bootstrap Artifacts
- Namespace creation
- Service account provisioning
- RBAC permissions for deployments

## Next Steps

1. Configure Jenkins credentials (registry, kubeconfig)
2. Update registry paths in values files
3. Apply Kubernetes bootstrap artifacts
4. Configure GitHub webhook
5. Trigger first deployment

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

