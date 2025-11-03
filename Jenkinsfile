pipeline {
  agent any
  options { timestamps() }
  environment { KUBECONFIG = "C:\\kube\\config" }

  stages {
    stage("Checkout") { steps { checkout scm } }

    stage("Show committed changes") {
      steps { powershell 'git --no-pager log -1 --pretty=format:"%h %an %ad %s" --date=iso' }
    }

stage("Build image inside Minikube") {
  steps {
    powershell '''
      # Attach Docker client to Minikube's Docker daemon
      $envText = (& minikube -p minikube docker-env --shell powershell | Out-String)
      if ([string]::IsNullOrWhiteSpace($envText)) { Write-Error "minikube docker-env returned empty output"; exit 1 }
      Invoke-Expression $envText

      # Tag from commit
      $short = (git rev-parse --short=7 HEAD)
      $tag = "blogpress:dev-$short"

      # IMPORTANT: build from subfolder as context
      docker build -t $tag -f blog-frontend/Dockerfile blog-frontend

      # Render manifests
      New-Item -ItemType Directory -Force -Path render | Out-Null
      (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) |
        Set-Content -NoNewline render/deployment.yaml
      Copy-Item k8s/service.yaml render/service.yaml -Force
    '''
  }
}


stage("Deploy to Minikube") {
  steps {
    powershell '''
      minikube kubectl -- apply -f render/deployment.yaml
      minikube kubectl -- apply -f render/service.yaml
      minikube kubectl -- rollout status deploy/blogpress --timeout=120s
      minikube kubectl -- get pods -l app=blogpress -o wide
      minikube kubectl -- get svc blogpress -o wide
    '''
  }
}

  }
}