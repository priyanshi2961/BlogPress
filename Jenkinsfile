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
      # Show version/profile list
      minikube version
      minikube profile list

      # Ensure the minikube cluster exists & is running for this account
      $st = (minikube -p minikube status | Out-String)
      if ($st -notmatch "host: Running") {
        Write-Host "Minikube not running. Starting..."
        minikube start -p minikube --driver=docker --cpus=2 --memory=4096
        $st = (minikube -p minikube status | Out-String)
        if ($st -notmatch "host: Running") {
          Write-Error "Minikube failed to start. Status:`n$st"; exit 1
        }
      }

      # Switch Docker client to minikube's Docker daemon
      $envText = (& minikube -p minikube docker-env --shell powershell | Out-String)
      if ([string]::IsNullOrWhiteSpace($envText)) {
        Write-Error "minikube docker-env returned empty output (wrong MINIKUBE_HOME/profile?)"; exit 1
      }
      Invoke-Expression $envText

      docker version

      # Tag image from commit
      $short = if ($env:GIT_COMMIT) { $env:GIT_COMMIT.Substring(0,7) } else { (git rev-parse --short=7 HEAD) }
      $tag = "blogpress:dev-$short"

      # Build image inside minikube docker
      docker build -t $tag .

      # Render manifests with image tag
      New-Item -ItemType Directory -Force -Path render | Out-Null
      (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) | Set-Content -NoNewline render/deployment.yaml
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