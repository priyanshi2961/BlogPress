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
                powershell '''
                git log -1 --pretty=oneline
                '''
            }
        }

        stage('Build image inside Minikube') {
            steps {
                powershell '''
                Write-Host "=== Attach to Minikube Docker environment ==="
                $envText = & minikube -p minikube docker-env --shell powershell
                if (-not $envText) { throw "minikube docker-env returned empty output" }
                Invoke-Expression $envText

                Write-Host "=== Verify Docker connection ==="
                docker info | Select-String "Server Version"

                Write-Host "=== Tag and Build Docker image ==="
                $short = (git rev-parse --short=7 HEAD)
                $tag = "blogpress:dev-$short"

                docker build -t $tag -f blog-frontend/Dockerfile blog-frontend

                Write-Host "=== Render manifests ==="
                New-Item -ItemType Directory -Force -Path render | Out-Null
                (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) | 
                    Set-Content -NoNewline render/deployment.yaml
                Copy-Item k8s/service.yaml render/service.yaml -Force
                '''
            }
        }

        stage('Deploy to Minikube') {
            steps {
                powershell '''
                Write-Host "=== Verify cluster state ==="
                minikube status

                Write-Host "=== Update context ==="
                minikube -p minikube update-context

                Write-Host "=== Apply manifests via Minikube kubectl ==="
                minikube kubectl -- apply -f render/deployment.yaml
                minikube kubectl -- apply -f render/service.yaml

                Write-Host "=== Show deployed pods ==="
                minikube kubectl -- get pods -o wide

                Write-Host "=== Show services ==="
                minikube kubectl -- get svc -o wide
                '''
            }
        }
    }

    post {
        failure {
            powershell '''
            Write-Host "❌ Pipeline failed. Showing Minikube logs..."
            minikube logs --tail=50
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
