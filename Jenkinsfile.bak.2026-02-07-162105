pipeline {
    agent any

    environment {
        // Docker Hub
        DOCKER_HUB_USERNAME = 'zouboupe'
        DOCKER_IMAGE = "${DOCKER_HUB_USERNAME}/pokemon-app"
        DOCKER_TAG = "${BUILD_NUMBER}"

        // Jenkins Credentials (Secret text ID)
        DOCKER_CREDENTIALS_ID = 'dockerhub-token'

        // Namespace Kubernetes
        K8S_NAMESPACE = 'pokemon-app'
    }

    triggers {
        // Vérification du SCM toutes les 5 minutes
        pollSCM('*/5 * * * *')
    }

    stages {
        // ============================================
        // Stage 1: Récupération du code source
        // ============================================
        stage('Checkout') {
            steps {
                echo "📥 Récupération du code source depuis GitHub..."
                checkout scm
                echo "✅ Code source récupéré avec succès"
            }
        }

        // ============================================
        // Stage 2: Installation des dépendances
        // ============================================
        stage('Install Dependencies') {
            steps {
                echo "📦 Installation des dépendances..."
                sh 'npm ci'
                echo "✅ Dépendances installées"
            }
        }

        // ============================================
        // Stage 4: Construction de l'image Docker
        // ============================================
        stage('Build Docker Image') {
            steps {
                echo "🐳 Construction de l'image Docker..."
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                echo "✅ Image Docker construite: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }

        // ============================================
        // Stage 5: Push vers Docker Hub
        // ============================================
        stage('Push to Docker Hub') {
            steps {
                echo "📤 Publication de l'image sur Docker Hub..."
                withCredentials([string(credentialsId: DOCKER_CREDENTIALS_ID, variable: 'DOCKER_TOKEN')]) {
                    // Double quotes: interpolation de ${DOCKER_HUB_USERNAME}
                    // \$DOCKER_TOKEN: passe la variable au shell
                    sh "echo \$DOCKER_TOKEN | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
                echo "✅ Image publiée sur Docker Hub"
            }
        }

        // ============================================
        // Stage 6: Déploiement avec Helm
        // ============================================
        stage('Deploy with Helm') {
            steps {
                echo "☸️ Déploiement sur Kubernetes avec Helm..."
                sh """
                    # Mise à jour de l'image dans values.yaml
                    sed -i 's|repository:.*|repository: ${DOCKER_IMAGE}|g' helm/pokemon-app/values.yaml
                    sed -i 's|tag:.*|tag: "${DOCKER_TAG}"|g' helm/pokemon-app/values.yaml

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
                echo "✅ Déploiement Helm terminé"
            }
        }

        // ============================================
        // Stage 7: Vérification du déploiement
        // ============================================
        stage('Verify Deployment') {
            steps {
                echo "🔍 Vérification du déploiement..."
                sh """
                    kubectl rollout status deployment/pokemon-app -n ${K8S_NAMESPACE} --timeout=120s
                    kubectl get pods -n ${K8S_NAMESPACE}
                    kubectl get svc -n ${K8S_NAMESPACE}
                """
                echo "✅ Déploiement vérifié"
            }
        }
    }

    post {
        always {
            echo "🧹 Nettoyage..."
            // Suppression des images locales pour libérer de l'espace
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
            // Déconnexion de Docker Hub
            sh 'docker logout || true'
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
