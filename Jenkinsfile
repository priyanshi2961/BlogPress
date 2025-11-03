pipeline {
  agent any
  options { timestamps() }   // keep logs time-stamped

  stages {

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Show committed changes') {
      steps {
        // No --short anywhere (some bundled kubectl doesn't support it)
        powershell 'git --no-pager log -1 --pretty=format:"%h %an %ad %s" --date=iso'
      }
    }

    stage('Build image inside Minikube') {
      steps {
        powershell '''
          Write-Host "=== Attach to Minikube Docker env ==="
          $envText = (& minikube -p minikube docker-env --shell powershell | Out-String)
          if ([string]::IsNullOrWhiteSpace($envText)) { Write-Error "minikube docker-env failed"; exit 1 }
          Invoke-Expression $envText

          # Build/tag image from current commit
          $short = (git rev-parse --short=7 HEAD).Trim()
          $tag = "blogpress:dev-$short"

          Write-Host "=== Docker build $tag ==="
          docker build -t $tag .

          # Prepare rendered manifests
          New-Item -ItemType Directory -Force -Path render | Out-Null
          (Get-Content -Raw k8s/deployment.yaml).
            Replace("REPLACE_IMAGE", $tag) |
            Set-Content -NoNewline -Encoding ascii render/deployment.yaml

          Copy-Item k8s/service.yaml render/service.yaml -Force
        '''
      }
    }

    stage('Deploy to Minikube') {
      steps {
        powershell '''
          Write-Host "=== Attach to Minikube Docker env ==="
          $envText = (& minikube -p minikube docker-env --shell powershell | Out-String)
          if ([string]::IsNullOrWhiteSpace($envText)) { Write-Error "minikube docker-env failed"; exit 1 }
          Invoke-Expression $envText

          # Ensure we don't inherit any stale K8s env from the Jenkins service
          Remove-Item Env:KUBECONFIG            -ErrorAction SilentlyContinue
          Remove-Item Env:KUBERNETES_MASTER     -ErrorAction SilentlyContinue
          Remove-Item Env:KUBERNETES_SERVICE_HOST -ErrorAction SilentlyContinue
          Remove-Item Env:KUBERNETES_SERVICE_PORT -ErrorAction SilentlyContinue

          Write-Host "=== Verify cluster via minikube kubectl ==="
          # This avoids your host kubectl entirely
          minikube -p minikube kubectl -- version

          Write-Host "=== Update context & create a FRESH kubeconfig for THIS RUN ==="
          # Make sure minikube knows the current API port
          minikube -p minikube update-context | Out-Null

          # Dump a clean raw kubeconfig and force a safe on-disk encoding (no BOM)
          $raw = (& minikube -p minikube kubectl -- config view --raw | Out-String)
          $kcfgPath = Join-Path $env:WORKSPACE 'kubeconfig'
          Set-Content -Path $kcfgPath -Value $raw -NoNewline -Encoding ascii

          Write-Host "=== Quick status (should show Running) ==="
          minikube -p minikube status

          Write-Host "=== Deploy manifests (using minikube kubectl with explicit kubeconfig) ==="
          # NOTE: everything after the second -- is passed to kubectl
          minikube -p minikube kubectl -- --kubeconfig="$kcfgPath" apply -f render/deployment.yaml --validate=false
          minikube -p minikube kubectl -- --kubeconfig="$kcfgPath" apply -f render/service.yaml --validate=false

          Write-Host "=== Objects after deploy ==="
          minikube -p minikube kubectl -- --kubeconfig="$kcfgPath" get pods -o wide
          minikube -p minikube kubectl -- --kubeconfig="$kcfgPath" get svc -o wide
        '''
      }
    }
  }
}
