pipeline {
  agent {
    kubernetes {
      defaultContainer 'node'
      yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: pokemon-pipeline
spec:
  serviceAccountName: jenkins
  volumes:
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
  containers:
    - name: node
      image: node:20-alpine
      command: ["sh", "-c", "cat"]
      tty: true

    - name: docker
      image: docker:27-cli
      command: ["sh", "-c", "cat"]
      tty: true
      volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock

    - name: helm
      image: alpine/helm:3.15.4
      command: ["sh", "-c", "cat"]
      tty: true

    - name: kubectl
      image: bitnami/kubectl:1.35.0
      command: ["sh", "-c", "cat"]
      tty: true
"""
    }
  }

  environment {
    DOCKER_HUB_USERNAME = 'zouboupe'
    DOCKER_IMAGE = "${DOCKER_HUB_USERNAME}/pokemon-app"
    DOCKER_TAG = "${BUILD_NUMBER}"
    DOCKER_CREDENTIALS_ID = 'dockerhub-token'
    K8S_NAMESPACE = 'pokemon-app'
  }

  triggers {
    pollSCM('*/5 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        echo "📥 Récupération du code source depuis GitHub..."
        checkout scm
        echo "✅ Code source récupéré avec succès"
      }
    }

    stage('Install Dependencies') {
      steps {
        echo "📦 Installation des dépendances..."
        container('node') {
          sh 'npm ci'
        }
        echo "✅ Dépendances installées"
      }
    }

    stage('Build Docker Image') {
      steps {
        echo "🐳 Construction de l'image Docker..."
        container('docker') {
          sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
          sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
        }
        echo "✅ Image Docker construite: ${DOCKER_IMAGE}:${DOCKER_TAG}"
      }
    }

    stage('Push to Docker Hub') {
      steps {
        echo "📤 Publication de l'image sur Docker Hub..."
        container('docker') {
          withCredentials([string(credentialsId: DOCKER_CREDENTIALS_ID, variable: 'DOCKER_TOKEN')]) {
            sh "echo \$DOCKER_TOKEN | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"
            sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
            sh "docker push ${DOCKER_IMAGE}:latest"
          }
        }
        echo "✅ Image publiée sur Docker Hub"
      }
    }

    stage('Deploy with Helm') {
      steps {
        echo "☸️ Déploiement sur Kubernetes avec Helm..."
        container('helm') {
          sh """
            # Vérifier si le release existe
            if helm status pokemon-app -n ${K8S_NAMESPACE} > /dev/null 2>&1; then
              echo "📦 Mise à jour du déploiement existant..."
              helm upgrade pokemon-app ./helm/pokemon-app \
                --namespace ${K8S_NAMESPACE} \
                --set image.repository=${DOCKER_IMAGE} \
                --set image.tag=${DOCKER_TAG}
            else
              echo "🆕 Nouveau déploiement..."
              helm install pokemon-app ./helm/pokemon-app \
                --namespace ${K8S_NAMESPACE} \
                --create-namespace \
                --set image.repository=${DOCKER_IMAGE} \
                --set image.tag=${DOCKER_TAG}
            fi
          """
        }
        echo "✅ Déploiement Helm terminé"
      }
    }

    stage('Verify Deployment') {
      steps {
        echo "🔍 Vérification du déploiement..."
        container('kubectl') {
          sh """
            kubectl rollout status deployment/pokemon-app -n ${K8S_NAMESPACE} --timeout=180s
            kubectl get pods -n ${K8S_NAMESPACE}
            kubectl get svc -n ${K8S_NAMESPACE}
          """
        }
        echo "✅ Déploiement vérifié"
      }
    }
  }

  post {
    always {
      echo "🧹 Nettoyage..."
      container('docker') {
        sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
        sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        sh "docker logout || true"
      }
    }
    success {
      echo """
========================================
🎉 Pipeline exécutée avec succès!
========================================
Image: ${DOCKER_IMAGE}:${DOCKER_TAG}
Namespace: ${K8S_NAMESPACE}
========================================
"""
    }
    failure {
      echo "❌ La pipeline a échoué. Vérifiez les logs ci-dessus."
    }
  }
}
