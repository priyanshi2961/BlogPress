pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {

    stage('Checkout SCM') {
      steps {
        checkout scm
      }
    }

    stage('Show committed changes') {
      steps {
        powershell '''
          git --no-pager log -1 --pretty=format:"%h %an %ad %s" --date=local
        '''
      }
    }

    stage('Build image inside Minikube') {
      steps {
        powershell '''
          Write-Host "=== Verify Docker service ==="
          $svc = Get-Service -Name com.docker.service -ErrorAction SilentlyContinue
          if ($null -eq $svc -or $svc.Status -ne 'Running') {
            Write-Host "Starting Docker service..."
            Start-Service com.docker.service
            Start-Sleep -Seconds 10
          }

          Write-Host "=== Ensure Minikube is up ==="
          # Try to read status in JSON (robust way)
          $st = $null
          try { $st = (& minikube status --output=json | ConvertFrom-Json) } catch {}
          $needStart = $true
          if ($st -ne $null) {
            if ($st.Host -eq 'Running' -and $st.Kubelet -eq 'Running' -and $st.APIServer -eq 'Running') {
              $needStart = $false
            }
          }
          if ($needStart) {
            Write-Host "Starting minikube profile 'minikube'..."
            & minikube start -p minikube --driver=docker --cpus=2 --memory=3500 --wait=all
            if ($LASTEXITCODE -ne 0) { throw "minikube start failed" }
          }

          Write-Host "=== Attach Docker CLI to Minikube’s Docker daemon ==="
          $envText = & minikube -p minikube docker-env --shell powershell | Out-String
          if ([string]::IsNullOrWhiteSpace($envText)) { throw "docker-env produced no output (is minikube running?)" }
          Invoke-Expression $envText
          docker info | Select-String "Server Version" | Out-Host

          Write-Host "=== Build app image ==="
          $short = (git rev-parse --short=7 HEAD).Trim()
          $tag   = "blogpress:dev-$short"
          docker build -t $tag -f blog-frontend/Dockerfile blog-frontend
          if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

          # Save tag for next stage
          Set-Content -Path "render/.imagetag" -Value $tag -Force
        '''
      }
    }

    stage('Deploy to Minikube') {
      steps {
        powershell '''
          # Reattach to minikube docker to be safe
          $envText = & minikube -p minikube docker-env --shell powershell | Out-String
          Invoke-Expression $envText

          # Render manifests with the image we just built
          $tag = Get-Content render/.imagetag -Raw
          New-Item -ItemType Directory -Force -Path render | Out-Null
          (Get-Content -Raw k8s/deployment.yaml).Replace("REPLACE_IMAGE", $tag) | Set-Content -NoNewline render/deployment.yaml
          Copy-Item k8s/service.yaml render/service.yaml -Force

          # Apply
          & minikube kubectl -- apply -f render/deployment.yaml
          & minikube kubectl -- apply -f render/service.yaml

          # Show what we have
          & minikube kubectl -- get pods -o wide
          & minikube kubectl -- get svc
        '''
      }
    }
  }

  post {
    success {
      powershell 'Write-Host "✅ Successfully built and deployed BlogPress to Minikube!"'
    }
    failure {
      // don’t crash if minikube logs flags change; best-effort
      powershell '''
        Write-Host "❌ Pipeline failed. Dumping minikube status:"
        minikube status
      '''
    }
  }
}
