# 🎮 Pokemon-V1 - Application Pokédex avec CI/CD Complète

Application web React permettant de rechercher et explorer les Pokémon, avec une chaîne CI/CD complète utilisant **Docker, Jenkins, Kubernetes, Helm, ArgoCD, Prometheus et Grafana**.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue)
![Helm](https://img.shields.io/badge/Helm-v3-purple)
![ArgoCD](https://img.shields.io/badge/ArgoCD-GitOps-orange)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-red)

---

## 📋 Table des matières

1. [Fonctionnalités](#-fonctionnalités)
2. [Architecture](#-architecture)
3. [Prérequis VM Ubuntu](#-prérequis-vm-ubuntu)
4. [Installation de l'environnement](#-installation-de-lenvironnement)
5. [Docker](#-docker)
6. [Jenkins CI/CD](#-jenkins-cicd)
7. [Kubernetes avec Helm](#-kubernetes-avec-helm)
8. [ArgoCD (GitOps)](#-argocd-gitops)
9. [Monitoring Prometheus + Grafana](#-monitoring-prometheus--grafana)
10. [Structure du projet](#-structure-du-projet)

---

## ✨ Fonctionnalités

- 🔍 **Recherche de Pokémon** - Recherche par nom avec détails complets
- 📚 **Pokédex par génération** - Navigation par génération (I à IX)
- 📖 **Pokédex complet** - Liste paginée de tous les Pokémon
- ✨ **Sprites shiny** - Visualisation des formes shiny

---

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Jenkins   │────▶│ Docker Hub  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   ArgoCD    │────▶│ Kubernetes  │
                    │  (GitOps)   │     │  (Minikube) │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Prometheus  │
                                        │  + Grafana  │
                                        └─────────────┘
```

---

## 🖥 Prérequis VM Ubuntu

Votre VM Ubuntu doit avoir au minimum :
- **RAM** : 4 Go (8 Go recommandé)
- **CPU** : 2 cores
- **Disque** : 20 Go
- **Ubuntu** : 20.04 ou 22.04

---

## 🔧 Installation de l'environnement

### Étape 1 : Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### Étape 2 : Installer Docker

```bash
# Installer Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Vérifier l'installation
docker --version
```

### Étape 3 : Installer Minikube

```bash
# Télécharger Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Démarrer Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Vérifier
minikube status
```

### Étape 4 : Installer kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Vérifier
kubectl version --client
```

### Étape 5 : Installer Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Vérifier
helm version
```

### Étape 6 : Installer Jenkins sur Minikube (Helm)

Nous allons installer Jenkins directement dans le cluster Kubernetes :

```bash
# Ajouter le repo Helm Jenkins
helm repo add jenkins https://charts.jenkins.io
helm repo update

# Créer le namespace
kubectl create namespace jenkins

# Installer Jenkins
helm install jenkins jenkins/jenkins \
  --namespace jenkins \
  --set controller.serviceType=NodePort

# Récupérer le mot de passe Admin
kubectl exec --namespace jenkins -it svc/jenkins -c jenkins -- /bin/cat /run/secrets/additional/chart-admin-password && echo

# Donner les droits admin cluster à Jenkins (IMPORTANT pour le déploiement)
kubectl create clusterrolebinding jenkins-admin-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins
```

**Accéder à Jenkins** :
```bash
minikube service jenkins -n jenkins
```

---

## 🐳 Docker

### Construire l'image

```bash
# Cloner le projet (si pas déjà fait)
git clone https://github.com/Nabilou-Anoir/Pokemon-V1.git
cd Pokemon-V1

# Construire l'image
docker build -t pokemon-app:latest .

# Tester localement
docker run -d -p 8080:80 --name pokemon-test pokemon-app:latest

# Accéder à l'application
curl http://localhost:8080
# Ou ouvrir dans le navigateur

# Nettoyer après test
docker stop pokemon-test && docker rm pokemon-test
```

### Pousser sur Docker Hub

```bash
# Se connecter à Docker Hub
docker login

# Tag et push
docker tag pokemon-app:latest zouboupe/pokemon-app:latest
docker push zouboupe/pokemon-app:latest
```

---

## 🔄 Jenkins CI/CD

### Étape 1 : Configuration initiale de Jenkins

1. Lancer `minikube service jenkins -n jenkins` pour obtenir l'URL
2. Entrer le mot de passe admin récupéré précédemment
3. Installer les plugins suggérés
4. Créer un utilisateur admin

### Étape 2 : Installer les plugins nécessaires

Aller dans **Manage Jenkins** > **Plugins** > **Available plugins** :
- Docker Pipeline
- Git
- Pipeline
- Kubernetes CLI

### Étape 3 : Configurer les credentials Docker Hub

1. **Manage Jenkins** > **Credentials** > **System** > **Global credentials**
2. **Add Credentials** :
   - **Kind** : Secret text
   - **Secret** : Votre Token d'accès Docker Hub (Settings > Security > New Access Token)
   - **ID** : `dockerhub-token`
   - **Description** : Docker Hub Token

### Étape 4 : Modifier le Jenkinsfile

⚠️ **IMPORTANT** : Ouvrez le fichier `Jenkinsfile` et remplacez :
```groovy
DOCKER_HUB_USERNAME = 'zouboupe'

```

### Étape 5 : Créer le Pipeline

1. **New Item** > Nom : `Pokemon-App-Pipeline` > Type : **Pipeline**
2. Configuration :
   - **Pipeline** > **Definition** : Pipeline script from SCM
   - **SCM** : Git
   - **Repository URL** : `https://github.com/Nabilou-Anoir/Pokemon-V1.git`
   - **Branch** : `*/main`
   - **Script Path** : `Jenkinsfile`
3. **Save** et **Build Now**

---

## ☸️ Kubernetes avec Helm

### Modifier les values

⚠️ Avant de déployer, éditez `helm/pokemon-app/values.yaml` :
```yaml
image:
  repository: zouboupe/pokemon-app
```

### Déployer avec Helm

```bash
# Vérifier que Minikube est démarré
minikube status

# Si non démarré
minikube start

# Déployer avec Helm
helm install pokemon-app ./helm/pokemon-app

# Vérifier le déploiement
kubectl get pods -n pokemon-app
kubectl get svc -n pokemon-app

# Accéder à l'application
minikube service pokemon-app-service -n pokemon-app
```

### Commandes Helm utiles

```bash
# Voir le status
helm status pokemon-app

# Mettre à jour après modification
helm upgrade pokemon-app ./helm/pokemon-app

# Désinstaller
helm uninstall pokemon-app
```

---

## 🔄 ArgoCD (GitOps)

### Installer ArgoCD

```bash
# Créer le namespace
kubectl create namespace argocd

# Installer ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que les pods soient prêts
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Récupérer le mot de passe admin
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo  # Pour retour à la ligne
```

### Accéder à ArgoCD UI

```bash
# Option 1 : Port-forward
kubectl port-forward svc/argocd-server -n argocd 8443:443

# Accéder à https://localhost:8443
# Username: admin
# Password: (celui récupéré ci-dessus)
```

### Configurer l'Application ArgoCD

⚠️ Modifiez `argocd/application.yaml` :
```yaml
source:
  repoURL: https://github.com/Nabilou-Anoir/Pokemon-V1.git
```

Puis appliquez :
```bash
kubectl apply -f argocd/application.yaml
```

ArgoCD va maintenant :
- Surveiller votre repo GitHub
- Déployer automatiquement les changements
- Synchroniser l'état désiré avec le cluster

---

## 📊 Monitoring Prometheus + Grafana

### Installer kube-prometheus-stack

```bash
# Ajouter le repo Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Installer le stack de monitoring
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123

# Attendre que les pods soient prêts
kubectl wait --for=condition=Ready pods --all -n monitoring --timeout=300s

# Vérifier l'installation
kubectl get pods -n monitoring
```

### Accéder à Grafana

```bash
# Port-forward Grafana
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```

Accéder à `http://localhost:3000` :
- **Username** : admin
- **Password** : admin123 (ou prom-operator si non spécifié)

### Importer des Dashboards

1. Dans Grafana : **+** > **Import**
2. Entrer l'ID du dashboard :
   - **6417** : Kubernetes Cluster Overview
   - **13770** : Kubernetes Pods Dashboard
   - **1860** : Node Exporter Full
3. Sélectionner la datasource Prometheus
4. **Import**

### Accéder à Prometheus

```bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090
```

Accéder à `http://localhost:9090`

### Appliquer les règles d'alerte (Bonus)

```bash
kubectl apply -f monitoring/prometheus-rules.yaml
```

---

## 📁 Structure du projet

```
Pokemon-V1/
├── src/                          # Code source React
├── helm/                         # Helm Chart
│   └── pokemon-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           └── servicemonitor.yaml
├── argocd/                       # Configuration ArgoCD
│   └── application.yaml
├── monitoring/                   # Configuration Prometheus
│   └── prometheus-rules.yaml
├── k8s/                          # Manifests K8s (alternatif à Helm)
│   ├── namespace.yaml
│   ├── deployment.yaml
│   └── service.yaml
├── Dockerfile                    # Image Docker
├── Jenkinsfile                   # Pipeline CI/CD
├── nginx.conf                    # Config Nginx
└── README.md                     # Documentation
```

---

## ✅ Checklist du cahier des charges

| Exigence | Status | Fichier(s) |
|----------|--------|------------|
| Référentiel GitHub public | ✅ | - |
| Dockerfile fonctionnel | ✅ | `Dockerfile`, `nginx.conf` |
| Pipeline Jenkins | ✅ | `Jenkinsfile` |
| Objet Deployment K8s | ✅ | `helm/*/deployment.yaml` ou `k8s/deployment.yaml` |
| Objet Service K8s | ✅ | `helm/*/service.yaml` ou `k8s/service.yaml` |
| Déploiement Helm | ✅ | `helm/pokemon-app/` |
| ArgoCD (GitOps) | ✅ | `argocd/application.yaml` |
| Prometheus + Grafana | ✅ | Instructions dans README |
| Dashboard Grafana | ✅ | IDs: 6417, 13770, 1860 |
| Alerte Prometheus (Bonus) | ✅ | `monitoring/prometheus-rules.yaml` |

---

## 🔗 APIs utilisées

- [Tyradex API](https://tyradex.app/) - Données Pokémon en français
- [PokéAPI](https://pokeapi.co/) - API REST Pokémon complète

---

## 👤 Auteur

**Projet CaaS** - ISIS-E4-2-ISSNS-4  
Module enseigné par Mohamed Hedi DJEMAA
