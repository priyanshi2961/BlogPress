# BlogPress CI/CD Pipeline Documentation

## Overview

This document describes the production-ready CI/CD pipeline for the BlogPress microservices architecture. The pipeline uses Jenkins for orchestration, Docker for containerization, and Helm for Kubernetes deployments.

## Architecture

```
GitHub (webhook) → Jenkins (CI/CD) → Docker Registry → Kubernetes → Cloud Cluster
```

### Event Flow

1. **GitHub Webhook**: Triggers Jenkins on push and pull request events
2. **Jenkins Pipeline**: Executes build, test, scan, and deployment stages
3. **Docker Registry**: Stores built and scanned container images
4. **Kubernetes**: Receives deployments via Helm charts
5. **Cloud Cluster**: Runs the deployed microservices

## Pipeline Configuration

### Global Parameters

Configure these in Jenkins Global Configuration or as environment variables:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `GLOBAL_REGISTRY` | Docker registry base URL | `docker.io/yourorg` or `gcr.io/project-id` |
| `REGISTRY_CREDENTIAL_ID` | Jenkins credential ID for registry push | `docker-registry-creds` |
| `KUBECONFIG_DEV_CREDENTIAL_ID` | Jenkins credential ID for dev kubeconfig | `kubeconfig-dev` |
| `KUBECONFIG_STAGING_CREDENTIAL_ID` | Jenkins credential ID for staging kubeconfig | `kubeconfig-staging` |
| `KUBECONFIG_PROD_CREDENTIAL_ID` | Jenkins credential ID for prod kubeconfig | `kubeconfig-prod` |
| `HELM_RELEASE_PREFIX` | Prefix for all Helm releases | `blogpress` |
| `SCAN_SEVERITY_THRESHOLD` | Blocking severity levels | `CRITICAL,HIGH` |
| `ALLOW_UNFIXED_NON_PROD` | Allow unfixed vulnerabilities in dev/staging | `true` |
| `PROD_OVERRIDE_PARAMETER` | Parameter name for production override | `PROD_OVERRIDE` |

### Build Parameters

Available at pipeline execution:

- **TARGET_ENVIRONMENT**: Select deployment environment (dev/staging/prod)
- **IMAGE_TAG_OVERRIDE**: Override auto-detected image tag
- **SERVICE_LIST**: Comma-separated service names to build/deploy (empty = all)
- **SKIP_SCAN**: Skip vulnerability scanning (restricted to authorized users)
- **PROD_OVERRIDE**: Override production blockers (restricted to authorized users)

## Event Routing

### GitHub Webhook Configuration

1. Repository Settings → Webhooks → Add webhook
2. Payload URL: `https://your-jenkins-server/github-webhook/`
3. Content type: `application/json`
4. Events: Push, Pull request
5. Active: ✓

### Event-to-Environment Mapping

| Event | Build | Deploy | Target Environment |
|-------|-------|--------|-------------------|
| Push to non-main branch | ✓ | Optional | dev |
| Pull request | ✓ | ✗ | None |
| Merge to main | ✓ | ✓ | staging |
| Tag starting with "v" | ✓ | ✓ (after approval) | prod |

## Image Versioning

The pipeline uses the following priority order for image tags:

1. **IMAGE_TAG_OVERRIDE** parameter (if provided)
2. **Git tag** (if present and matches pattern `v*`)
3. **Short commit SHA** (default, 7 characters)

### Additional Tagging

- Non-main branches receive an additional branch tag (e.g., `feature-xyz`)
- Main branch merges use the commit SHA
- Production tags use the Git tag name

### Version Resolution Utility

The pipeline includes a version resolution utility that:
- Checks for IMAGE_TAG_OVERRIDE parameter
- Inspects Git tags on the current commit
- Falls back to short commit SHA (`git rev-parse --short HEAD`)
- Generates branch tag for non-main branches
- Stores final tag in `IMAGE_TAG` variable for subsequent stages

## Vulnerability Scanning

### Scanning Process

1. All built images are scanned using configured scanner (Trivy, Snyk, etc.)
2. Findings are extracted and categorized by severity
3. Results are checked against `SCAN_SEVERITY_THRESHOLD`
4. Blocking occurs if critical/high severity issues are found

### Severity Handling

- **CRITICAL/HIGH**: Blocks deployment unless overridden
- **MEDIUM/LOW**: Logged but non-blocking
- **Non-production**: `ALLOW_UNFIXED_NON_PROD` allows unfixed issues in dev/staging
- **Production**: Requires `PROD_OVERRIDE` parameter (restricted to authorized users)

### Scanning Configuration

- Scanner tool must be available in Jenkins agent (or use controlled tools image)
- Severity threshold configurable via `SCAN_SEVERITY_THRESHOLD`
- Unfixed vulnerabilities can be ignored for non-production via `ALLOW_UNFIXED_NON_PROD`
- Production overrides require manual approval and authorization

## Environment Mapping

### Branch-Based Mapping

- **Non-main branches**: Automatically map to `dev` namespace
- **Main branch merges**: Automatically map to `staging` namespace
- **Version tags (v\*)**: Map to `prod` namespace (after manual approval)

### Manual Override

The `TARGET_ENVIRONMENT` parameter allows manual selection of deployment target:
- Useful for hotfixes or emergency deployments
- Respects environment-specific RBAC permissions
- Still requires appropriate approvals for production

## Service Discovery

### Auto-Discovery

The pipeline automatically discovers services by:
1. Scanning the `./services/` directory
2. Identifying subdirectories containing a `Dockerfile`
3. Using directory names as service names

### Service List Override

The `SERVICE_LIST` parameter allows overriding auto-discovery:
- Format: Comma-separated list (e.g., `user-service,blog-service`)
- Useful for partial deployments or testing
- Empty value (default) uses all discovered services

## Build and Push Utility

The build and push utility performs:

1. **Multi-architecture builds**: Builds for amd64 and arm64 (if supported)
2. **Remote cache**: Uses registry cache layers when available
3. **SBOM attachment**: Attaches Software Bill of Materials when supported
4. **Registry push**: Pushes to `GLOBAL_REGISTRY` with resolved tags
5. **Authentication**: Uses `REGISTRY_CREDENTIAL_ID` for registry access

## Deployment Utility

The deployment utility:

1. **Environment selection**: Selects kubeconfig credential based on target environment
2. **Helm release application**: For each service:
   - Release name: `${HELM_RELEASE_PREFIX}-${SERVICE}-${ENV}`
   - Chart: `./helm-charts/microservice`
   - Values: `./helm-charts/values/${SERVICE}-${ENV}.yaml`
   - Image tag override: Replaces `PLACEHOLDER` in values file
3. **Stable ordering**: Deploys services in alphabetical order
4. **Rollout verification**: Waits for rollout completion per service
5. **Deployment notes**: Generates concise notes with tag, environment, and revision

## Helm Chart

### Reusable Chart Structure

All services use the shared `microservice` Helm chart located at `./helm-charts/microservice/`.

### Chart Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `docker.io/yourorg/user-service` |
| `image.tag` | Image tag (overridden at deploy) | `abc1234` |
| `image.pullSecret` | Image pull secret reference | `regcred` |
| `service.type` | Service type | `ClusterIP`, `NodePort`, `LoadBalancer` |
| `service.port` | Service port | `8081` |
| `probes.readiness` | Readiness probe configuration | Path, delays, thresholds |
| `probes.liveness` | Liveness probe configuration | Path, delays, thresholds |
| `resources.requests` | Resource requests | CPU, memory |
| `resources.limits` | Resource limits | CPU, memory |
| `autoscaling.enabled` | Enable autoscaling | `true`/`false` |
| `autoscaling.minReplicas` | Minimum replicas | `2` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `70` |
| `autoscaling.targetMemoryUtilizationPercentage` | Memory target | `80` |
| `podDisruptionBudget.enabled` | Enable PDB | `true`/`false` |
| `podDisruptionBudget.minAvailable` | Minimum available pods | `2` |
| `env` | Environment variables | List of key-value pairs |
| `configMapMounts` | ConfigMap volume mounts | List with name and mountPath |
| `secretMounts` | Secret volume mounts | List with name and mountPath |
| `strategy.type` | Deployment strategy | `RollingUpdate` |
| `ingress.enabled` | Enable ingress | `true`/`false` |
| `ingress.hosts` | Ingress host configuration | Host, paths, TLS |

### Environment-Specific Values

Each service requires three values files:
- `./helm-charts/values/${SERVICE}-dev.yaml`
- `./helm-charts/values/${SERVICE}-staging.yaml`
- `./helm-charts/values/${SERVICE}-prod.yaml`

These files set environment-specific:
- Image repository
- Default tag placeholder (`PLACEHOLDER` - replaced by pipeline)
- Service port
- Resource requests/limits
- Probe configuration
- Autoscaling settings
- Ingress configuration

### Release Naming

All Helm releases follow the pattern:
```
${HELM_RELEASE_PREFIX}-${SERVICE}-${ENV}
```

Example: `blogpress-user-service-dev`

## Kubernetes Bootstrap

### Namespaces

Three namespaces are created:
- `dev`: Development environment
- `staging`: Staging environment
- `prod`: Production environment

Each namespace has labels:
- `environment`: development/staging/production
- `managed-by`: jenkins
- `purpose`: ci-cd

### Service Accounts

A service account named `jenkins-deployer` is created in each namespace for Jenkins deployments.

### RBAC

Role-based access control grants:

**Read Access:**
- ConfigMaps, Secrets, Services, Endpoints, Pods, Namespaces

**Write Access:**
- Deployments, StatefulSets, ReplicaSets
- Pods (create, update, patch, delete)
- Ingresses
- HorizontalPodAutoscalers
- PodDisruptionBudgets

**Role Bindings:**
- `jenkins-deployer` ServiceAccount bound to `jenkins-deployer` Role in each namespace

### Kubeconfig Credentials

Jenkins requires kubeconfig credentials for each environment:
1. Create kubeconfig files with appropriate permissions
2. Store in Jenkins as Secret File credentials
3. Use credential IDs:
   - `kubeconfig-dev`
   - `kubeconfig-staging`
   - `kubeconfig-prod`

## Quality Gates

### Unit Tests

- Pipeline attempts to run unit tests for each service
- Test command: Look for conventional targets (e.g., `make test`, `npm test`, `mvn test`)
- Missing test targets are treated as non-fatal (warn only)
- Test results published as JUnit XML if available

### Vulnerability Scanning

- All images scanned before deployment
- Severity threshold enforced based on `SCAN_SEVERITY_THRESHOLD`
- Production deployments blocked on critical/high findings
- Override available via `PROD_OVERRIDE` parameter (restricted)

### Production Approval Gate

- Version tags (v*) trigger manual approval step
- Deployment summary displayed
- Requires authorized user approval
- Approval step blocks until user confirms

## Adding a New Service

To add a new microservice:

1. **Create service directory**: Add directory under `./services/${SERVICE_NAME}/`
2. **Add Dockerfile**: Include `Dockerfile` in service directory
3. **Create values files**: Add three values files:
   - `./helm-charts/values/${SERVICE_NAME}-dev.yaml`
   - `./helm-charts/values/${SERVICE_NAME}-staging.yaml`
   - `./helm-charts/values/${SERVICE_NAME}-prod.yaml`
4. **Configure values**: Set image repository, port, resources, probes, etc.
5. **Pipeline auto-discovery**: Service will be automatically included in builds

### Example Values File Template

Copy the `user-service-{env}.yaml` files and modify:
- `image.repository`: Set to service-specific repository
- `service.port`: Set to service's port
- `resources`: Adjust based on service requirements
- `probes.path`: Set to service's health check path
- `ingress.hosts`: Configure if ingress is needed

## Jenkins Plugins

Required Jenkins plugins:

- **Pipeline**: Pipeline plugin for declarative pipelines
- **Docker Pipeline**: Docker integration
- **Kubernetes**: Kubernetes integration
- **Kubernetes CLI**: kubectl integration
- **Helm**: Helm integration
- **Git**: Git integration
- **Credentials Binding**: Secure credential handling
- **Mask Passwords**: Mask secrets in console output
- **JUnit**: Test report publishing
- **Blue Ocean** (optional): Enhanced pipeline visualization

Install plugins via Jenkins Plugin Manager.

## Credentials Setup

### Docker Registry Credentials

1. Jenkins → Credentials → Add Credentials
2. Type: Username with password
3. Username: Registry username
4. Password: Registry password/token
5. ID: `docker-registry-creds` (matches `REGISTRY_CREDENTIAL_ID`)

### Kubeconfig Credentials

For each environment (dev, staging, prod):

1. Jenkins → Credentials → Add Credentials
2. Type: Secret file
3. File: Upload kubeconfig file
4. ID: `kubeconfig-${ENV}` (matches `KUBECONFIG_${ENV}_CREDENTIAL_ID`)

Ensure kubeconfig has appropriate permissions for the target namespace.

## Reporting

### Test Reports

- JUnit XML reports published if present in workspace
- Test results visible in Jenkins build status
- Test failures do not block deployment (informational)

### Deployment Notes

- Lightweight deployment notes archived as artifacts
- Contains: Service name, image tag, environment, Helm revision
- Accessible via Jenkins build artifacts

### Status Messages

- Success: Deployment summary with services and tags
- Failure: Error details and troubleshooting hints
- Clear indication of deployment target and approval status

## Customization

### Probes

Adjust in service-specific values files:
```yaml
probes:
  readiness:
    path: /custom/health
    initialDelaySeconds: 45
  liveness:
    path: /custom/alive
    initialDelaySeconds: 90
```

### Resources

Set per environment in values files:
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

### Autoscaling

Enable and configure:
```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Ingress

Configure per environment:
```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
```

## Troubleshooting

### Common Issues

1. **Service discovery fails**: Ensure `./services/` directory exists and contains service subdirectories with Dockerfiles
2. **Registry push fails**: Verify `REGISTRY_CREDENTIAL_ID` is correct and credentials have push permissions
3. **Deployment fails**: Check kubeconfig credentials and RBAC permissions
4. **Scanning fails**: Ensure scanner tool is available in Jenkins agent
5. **Production blocked**: Check vulnerability scan results and use `PROD_OVERRIDE` if authorized

## Security Considerations

- All secrets masked in console output
- Kubeconfig credentials stored securely in Jenkins
- Registry credentials stored securely
- Production overrides restricted to authorized users
- Vulnerability scanning enforced for production
- RBAC limits Jenkins permissions to necessary resources only

