# CI/CD File Structure and Responsibilities

## Complete File List

### Pipeline Configuration

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `Jenkinsfile` | Main pipeline definition | Orchestrates build, test, scan, and deployment stages; handles service discovery, version resolution, quality gates |
| `DOCUMENTATION.md` | Comprehensive documentation | Explains pipeline architecture, configuration parameters, deployment flows, troubleshooting |
| `QUICK_START.md` | Setup guide | Step-by-step instructions for initial configuration and first deployment |
| `README.md` | Overview | Quick reference and navigation guide |

### Helm Chart

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `helm-charts/microservice/Chart.yaml` | Chart metadata | Defines chart name, version, and type |
| `helm-charts/microservice/values.yaml` | Default values | Provides default configuration for all chart parameters |
| `helm-charts/microservice/templates/deployment.yaml` | Deployment template | Creates Kubernetes Deployment with configurable replicas, strategy, probes, resources |
| `helm-charts/microservice/templates/service.yaml` | Service template | Creates Kubernetes Service with configurable type and port |
| `helm-charts/microservice/templates/ingress.yaml` | Ingress template | Creates Ingress resource when enabled (optional) |
| `helm-charts/microservice/templates/hpa.yaml` | Autoscaler template | Creates HorizontalPodAutoscaler when enabled (optional) |
| `helm-charts/microservice/templates/pdb.yaml` | PDB template | Creates PodDisruptionBudget when enabled (optional) |
| `helm-charts/microservice/templates/serviceaccount.yaml` | ServiceAccount template | Creates ServiceAccount when enabled |
| `helm-charts/microservice/templates/_helpers.tpl` | Template helpers | Provides reusable template functions for naming and labels |

### Environment-Specific Values

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `helm-charts/values/user-service-dev.yaml` | Dev values | Configures user-service for development: minimal resources, single replica, no ingress |
| `helm-charts/values/user-service-staging.yaml` | Staging values | Configures user-service for staging: moderate resources, autoscaling enabled, ingress configured |
| `helm-charts/values/user-service-prod.yaml` | Prod values | Configures user-service for production: high resources, autoscaling, PDB, ingress with TLS |

### Kubernetes Bootstrap

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `kubernetes/bootstrap/namespaces.yaml` | Namespace definitions | Creates dev, staging, and prod namespaces with labels |
| `kubernetes/bootstrap/service-accounts.yaml` | Service account definitions | Creates jenkins-deployer service account in each namespace |
| `kubernetes/bootstrap/rbac.yaml` | RBAC configuration | Creates roles and role bindings granting deployment permissions to service accounts |

## Configuration Parameters Reference

### Jenkinsfile Environment Variables

All parameters are defined in the `environment` block of the Jenkinsfile:

```groovy
GLOBAL_REGISTRY              // Docker registry base URL
REGISTRY_CREDENTIAL_ID       // Jenkins credential ID for registry push
KUBECONFIG_DEV_CREDENTIAL_ID      // Jenkins credential ID for dev kubeconfig
KUBECONFIG_STAGING_CREDENTIAL_ID  // Jenkins credential ID for staging kubeconfig
KUBECONFIG_PROD_CREDENTIAL_ID     // Jenkins credential ID for prod kubeconfig
HELM_RELEASE_PREFIX          // Prefix for all Helm releases
SCAN_SEVERITY_THRESHOLD      // Comma-separated blocking severities
ALLOW_UNFIXED_NON_PROD       // Allow unfixed vulnerabilities in non-production
PROD_OVERRIDE_PARAMETER      // Parameter name for production override
```

### Build Parameters

Available when running pipeline:

- `TARGET_ENVIRONMENT`: Select deployment environment (dev/staging/prod)
- `IMAGE_TAG_OVERRIDE`: Override auto-detected image tag
- `SERVICE_LIST`: Comma-separated service names (empty = all)
- `SKIP_SCAN`: Skip vulnerability scanning (restricted)
- `PROD_OVERRIDE`: Override production blockers (restricted)

### Helm Chart Values

Key configurable values (set per service/environment):

- `image.repository`: Container image repository
- `image.tag`: Image tag (overridden by pipeline)
- `service.type`: Service type (ClusterIP/NodePort/LoadBalancer)
- `service.port`: Service port
- `probes.readiness`: Readiness probe configuration
- `probes.liveness`: Liveness probe configuration
- `resources.requests`: Resource requests (CPU, memory)
- `resources.limits`: Resource limits (CPU, memory)
- `autoscaling.*`: Autoscaling configuration
- `podDisruptionBudget.*`: PodDisruptionBudget configuration
- `ingress.*`: Ingress configuration (optional)

## Utility Descriptions

### Version Resolution Utility

**Location**: Jenkinsfile `Resolve Image Version` stage

**Behavior**:
1. Checks `IMAGE_TAG_OVERRIDE` parameter
2. Inspects Git tags on current commit (pattern: `v*`)
3. Falls back to short commit SHA (`git rev-parse --short HEAD`)
4. Generates branch tag for non-main branches
5. Stores result in `IMAGE_TAG` variable

**Output**: Final image tag string

### Build and Push Utility

**Location**: Jenkinsfile `Push Images` stage

**Behavior**:
1. Authenticates to registry using `REGISTRY_CREDENTIAL_ID`
2. Builds multi-architecture images (amd64, arm64) if supported
3. Uses remote cache layers when available
4. Attaches Software Bill of Materials (SBOM) when supported
5. Pushes to `GLOBAL_REGISTRY` with resolved tags

**Input**: Service name, resolved image tag
**Output**: Pushed image with tags

### Deployment Utility

**Location**: Jenkinsfile `Deploy to Environment` stage

**Behavior**:
1. Selects kubeconfig credential based on target environment
2. For each service in stable order:
   - Release name: `${HELM_RELEASE_PREFIX}-${SERVICE}-${ENV}`
   - Chart: `./helm-charts/microservice`
   - Values: `./helm-charts/values/${SERVICE}-${ENV}.yaml`
   - Override `image.tag` with resolved tag
   - Apply Helm release
3. Wait for rollout completion per service
4. Generate deployment notes

**Input**: Target environment, resolved image tag, service list
**Output**: Deployment status, release notes

## Naming Conventions

### Helm Releases

Pattern: `${HELM_RELEASE_PREFIX}-${SERVICE}-${ENV}`

Examples:
- `blogpress-user-service-dev`
- `blogpress-blog-service-staging`
- `blogpress-api-gateway-prod`

### Image Tags

- Override: Uses `IMAGE_TAG_OVERRIDE` if provided
- Version tag: Uses Git tag (e.g., `v1.0.0`)
- Default: Short commit SHA (e.g., `abc1234`)
- Branch tag: Additional tag for non-main branches (e.g., `feature-xyz`)

### Credentials

- Registry: `docker-registry-creds` (default)
- Kubeconfig: `kubeconfig-${ENV}` (e.g., `kubeconfig-dev`)

## TODO Items for Configuration

### Jenkinsfile

- [ ] Replace `GLOBAL_REGISTRY` with actual registry path
- [ ] Update credential IDs to match Jenkins credentials
- [ ] Adjust `SCAN_SEVERITY_THRESHOLD` based on security policy
- [ ] Configure `ALLOW_UNFIXED_NON_PROD` based on policy

### Values Files

- [ ] Update `image.repository` in all service values files
- [ ] Configure service-specific ports
- [ ] Set appropriate resource limits per environment
- [ ] Configure ingress hosts and TLS certificates
- [ ] Adjust autoscaling targets based on service requirements

### Bootstrap

- [ ] Verify namespace names match cluster configuration
- [ ] Ensure RBAC permissions match deployment requirements
- [ ] Configure kubeconfig credentials with appropriate permissions

## Adding New Services

When adding a new service:

1. **Service Directory**: Create `./services/${SERVICE_NAME}/` with Dockerfile
2. **Values Files**: Create three files:
   - `helm-charts/values/${SERVICE_NAME}-dev.yaml`
   - `helm-charts/values/${SERVICE_NAME}-staging.yaml`
   - `helm-charts/values/${SERVICE_NAME}-prod.yaml`
3. **Configuration**: Copy structure from `user-service-*.yaml` and customize:
   - Image repository
   - Service port
   - Resource requirements
   - Probe paths
   - Ingress configuration (if needed)

The pipeline will automatically discover and include the new service in builds and deployments.

