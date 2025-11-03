pipeline {
    agent any

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Show committed changes') {
            steps {
                powershell '''
                    git log -1 --pretty=format:"%h %an %ad %s"
                '''
            }
        }

        stage('Build image inside Minikube') {
            steps {
                powershell '''
                    Write-Host "=== Verify Minikube and Docker ==="
                    minikube status

                    # Attach Docker CLI to Minikube’s Docker daemon
                    Write-Host "=== Attaching to Minikube Docker environment ==="
                    & minikube -p minikube docker-env --shell powershell | Invoke-Expression

                    # Confirm we are building inside Minikube
                    docker info | Select-String "Server Version"

                    # Tag from latest commit
                    $short = (git rev-parse --short=7 HEAD)
                    $tag = "blogpress:dev-$short"

                    Write-Host "=== Building Docker image inside Minikube’s Docker engine ==="
                    docker build -t $tag -f blog-frontend/Dockerfile blog-frontend

                    Write-Host "=== Image built successfully ==="
                    docker images | Select-String "blogpress"
                '''
            }
        }

        stage('Deploy to Minikube') {
            steps {
                powershell '''
                    Write-Host "=== Deploying to Minikube ==="
                    $short = (git rev-parse --short=7 HEAD)
                    $tag = "blogpress:dev-$short"

                    (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) |
                        Set-Content -NoNewline render-deploy.yaml

                    kubectl apply -f render-deploy.yaml
                    kubectl apply -f k8s/service.yaml

                    kubectl get pods -o wide
                    kubectl get svc
                '''
            }
        }
    }

    post {
        failure {
            powershell 'Write-Host "❌ Pipeline failed. Check above logs for details."'
        }
        success {
            powershell 'Write-Host "✅ Successfully built and deployed BlogPress to Minikube!"'
        }
    }
}
