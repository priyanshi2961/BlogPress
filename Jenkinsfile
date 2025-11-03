pipeline {
    agent any

    environment {
        MINIKUBE_HOME = "${env.USERPROFILE}\\.minikube"
        KUBECONFIG = "${env.USERPROFILE}\\.kube\\config"
        PATH = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/priyanshi2961/BlogPress.git'
            }
        }

        stage('Show committed changes') {
            steps {
                powershell 'git log -1 --pretty=oneline'
            }
        }

        stage('Build image inside Minikube') {
            steps {
                powershell '''
                Write-Host "=== Verify Minikube and Docker ==="
                minikube -p minikube status
                minikube docker-env

                Write-Host "=== Tag from commit ==="
                $short = (git rev-parse --short=7 HEAD)
                $tag = "blogpress:dev-$short"

                Write-Host "=== Building Docker image inside Minikube VM ==="
                $cmd = "docker build -t $tag -f /hosthome/${env.USERNAME}/src/BlogPress/blog-frontend/Dockerfile /hosthome/${env.USERNAME}/src/BlogPress/blog-frontend"
                minikube -p minikube ssh $cmd

                if ($LASTEXITCODE -ne 0) { throw 'Docker build failed inside Minikube' }

                Write-Host "=== Rendering Kubernetes manifests ==="
                New-Item -ItemType Directory -Force -Path render | Out-Null
                (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) | 
                    Set-Content -NoNewline render/deployment.yaml
                Copy-Item k8s/service.yaml render/service.yaml -Force

                Write-Host "✅ Docker image built and manifests rendered successfully"
                '''
            }
        }

        stage('Deploy to Minikube') {
            steps {
                powershell '''
                Write-Host "=== Deploying manifests ==="
                minikube kubectl -- apply -f render/deployment.yaml
                minikube kubectl -- apply -f render/service.yaml

                Write-Host "=== Current Pods ==="
                minikube kubectl -- get pods -o wide

                Write-Host "=== Current Services ==="
                minikube kubectl -- get svc -o wide
                '''
            }
        }
    }

    post {
        failure {
            powershell '''
            Write-Host "❌ Pipeline failed. Fetching last 20 log lines..."
            minikube logs | Select-Object -Last 20
            '''
        }
        success {
            powershell '''
            Write-Host "✅ Deployment successful!"
            minikube service list
            '''
        }
    }
}
