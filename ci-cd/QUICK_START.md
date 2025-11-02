# CI/CD Quick Start Guide

This guide provides step-by-step instructions to set up the BlogPress CI/CD pipeline.

## Prerequisites

- Jenkins server with required plugins installed
- Kubernetes cluster access (dev, staging, prod)
- Docker registry access
- GitHub repository access

## Step 1: Jenkins Credentials

Create the following credentials in Jenkins:

### Docker Registry Credentials

1. Navigate to: Jenkins → Manage Jenkins → Credentials → System → Global credentials
2. Add Credentials:
   - Kind: Username with password
   - Username: `<registry-username>`
   - Password: `<registry-password-or-token>`
   - ID: `docker-registry-creds`
   - Description: Docker Registry Credentials

### Kubeconfig Credentials (One per Environment)

For each environment (dev, staging, prod):

1. Add Credentials:
   - Kind: Secret file
   - File: Upload kubeconfig file for the environment
   - ID: `kubeconfig-dev` (or `kubeconfig-staging`, `kubeconfig-prod`)
   - Description: Kubeconfig for ${ENV} environment

**Note**: Ensure kubeconfig files have appropriate permissions for their respective namespaces.

## Step 2: Configure Global Registry

Set the global registry value in the Jenkinsfile:

1. Edit `ci-cd/Jenkinsfile`
2. Locate the `environment` block
3. Update `GLOBAL_REGISTRY`:
   ```
   GLOBAL_REGISTRY = 'docker.io/yourorg'  // TODO: Replace with actual registry
   ```
   Replace `docker.io/yourorg` with your actual registry path (e.g., `gcr.io/project-id`, `registry.example.com`)

## Step 3: Update Values Files

For each service, update the image repository in all three values files:

1. Navigate to `ci-cd/helm-charts/values/`
2. For each `${SERVICE}-${ENV}.yaml` file:
   - Update `image.repository` to match your registry path
   - Example: `image.repository: docker.io/yourorg/user-service`

## Step 4: Configure GitHub Webhook

1. Navigate to GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - Payload URL: `https://your-jenkins-server/github-webhook/`
   - Content type: `application/json`
   - Events: Select "Let me select individual events"
     - ✓ Pushes
     - ✓ Pull requests
   - Active: ✓
4. Click "Add webhook"

## Step 5: Apply Kubernetes Bootstrap

Apply the Kubernetes bootstrap artifacts to create namespaces and RBAC:

```bash
# Apply namespaces
kubectl apply -f ci-cd/kubernetes/bootstrap/namespaces.yaml

# Apply service accounts
kubectl apply -f ci-cd/kubernetes/bootstrap/service-accounts.yaml

# Apply RBAC
kubectl apply -f ci-cd/kubernetes/bootstrap/rbac.yaml
```

Verify creation:
```bash
kubectl get namespaces dev staging prod
kubectl get serviceaccounts -n dev | grep jenkins-deployer
kubectl get roles -n dev | grep jenkins-deployer
```

## Step 6: Create Jenkins Pipeline Job

1. Navigate to: Jenkins → New Item
2. Enter item name: `BlogPress-CI-CD`
3. Select: Pipeline
4. Click OK
5. Configure:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your GitHub repository URL
   - Credentials: Add if repository is private
   - Branches to build: `*/main` (or your default branch)
   - Script Path: `ci-cd/Jenkinsfile`
6. Click Save

## Step 7: Trigger First Deployment to Dev

1. Push a branch (not main) to GitHub
2. The webhook will trigger Jenkins
3. Pipeline will:
   - Build images
   - Scan for vulnerabilities
   - Deploy to dev namespace
4. Monitor Jenkins console for deployment status
5. Verify deployment:
   ```bash
   kubectl get pods -n dev
   kubectl get deployments -n dev
   ```

## Step 8: Deploy to Staging

1. Merge your branch to main (via pull request or direct merge)
2. Pipeline will automatically:
   - Build images
   - Scan for vulnerabilities
   - Deploy to staging namespace
3. Verify deployment:
   ```bash
   kubectl get pods -n staging
   kubectl get deployments -n staging
   ```

## Step 9: Deploy to Production

1. Create a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Pipeline will:
   - Build images
   - Scan for vulnerabilities
   - **Pause for manual approval** (approval gate)
3. In Jenkins:
   - Navigate to the build
   - Review deployment summary
   - Click "Deploy to Production" to approve
4. Pipeline continues:
   - Deploys to prod namespace
   - Waits for rollout completion
5. Verify deployment:
   ```bash
   kubectl get pods -n prod
   kubectl get deployments -n prod
   ```

## Parameterized Deployments

To manually trigger a deployment with parameters:

1. Navigate to: Jenkins → BlogPress-CI-CD → Build with Parameters
2. Select parameters:
   - **TARGET_ENVIRONMENT**: Choose dev/staging/prod
   - **IMAGE_TAG_OVERRIDE**: (Optional) Override auto-detected tag
   - **SERVICE_LIST**: (Optional) Comma-separated service names
   - **SKIP_SCAN**: (Optional, restricted) Skip vulnerability scanning
   - **PROD_OVERRIDE**: (Optional, restricted) Override production blockers
3. Click Build

## Verification Checklist

After setup, verify:

- [ ] All Jenkins credentials created and accessible
- [ ] Global registry value set in Jenkinsfile
- [ ] Service values files updated with correct registry paths
- [ ] GitHub webhook configured and tested
- [ ] Kubernetes namespaces created (dev, staging, prod)
- [ ] Service accounts and RBAC applied
- [ ] Jenkins pipeline job created
- [ ] First dev deployment successful
- [ ] Staging deployment successful after merge to main
- [ ] Production deployment successful after version tag

## Next Steps

- Customize resource limits and requests per service
- Configure autoscaling for production services
- Set up ingress for public-facing services
- Configure monitoring and alerting
- Review and adjust vulnerability scanning thresholds
- Set up notification channels for deployment status

## Support

For issues or questions:
1. Check Jenkins console logs
2. Review pipeline documentation in `ci-cd/DOCUMENTATION.md`
3. Verify Kubernetes cluster connectivity
4. Check credential permissions
5. Review service-specific values files

