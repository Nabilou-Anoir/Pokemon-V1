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
- **Ubuntu** : 20.04, 22.04 ou 24.04

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

## 📊 Monitoring & Observabilité (Stack Complète)

Le projet intègre une stack d'observabilité avancée basée sur le TP "Monitoring + Service Mesh Observability".

### 🚀 Installation Automatique

Un script est disponible pour installer toute la stack (Prometheus, Grafana, Istio, Kiali) et configurer le namespace :

```bash
chmod +x scripts/setup-observability.sh
./scripts/setup-observability.sh
```

---

### 🔍 Détails de l'installation (Manuel)

Si vous n'utilisez pas le script, voici les composants installés :

#### 1. Prometheus + Grafana (`kube-prometheus-stack`)
Installé dans le namespace `monitoring`.
- **Repo** : `prometheus-community`
- **Composants** : Prometheus Operator, Node Exporter, Kube State Metrics, Grafana.

#### 2. Service Mesh (`Istio`)
Installé dans le namespace `istio-system`.
- **Composants** : Istio Base, Istiod (Control Plane), Ingress Gateway.
- **Injection** : Le namespace `pokemon-app` a le label `istio-injection=enabled`.

#### 3. Observabilité Mesh (`Kiali`)
Installé dans le namespace `istio-system`.
- Visualisation du graph de trafic et des métriques Istio.

---

### 🌐 Accéder aux Dashboards

#### 1. Grafana 📊
Visualisation des métriques Cluster et Pods.

```bash
# Récupérer le mot de passe admin
kubectl get secret -n monitoring kube-prom-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d; echo

# Port-forward
kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80
```
> Accès : [http://localhost:3000](http://localhost:3000) (User: admin / Password: voir ci-dessus)

#### 2. Prometheus 📈
Exploration des métriques brutes.

```bash
kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090
```
> Accès : [http://localhost:9090](http://localhost:9090)

#### 3. Kiali 🕸️
Observabilité du Service Mesh (Trafic, Erreurs, Latences du Pokemon App).

```bash
kubectl port-forward -n istio-system svc/kiali 20001:20001
```
> Accès : [http://localhost:20001](http://localhost:20001)

### 🧪 Tester l'Observabilité

Une fois l'application Pokemon déployée (via Jenkins/ArgoCD) :

1. Générer du trafic sur l'application :
   ```bash
   # Récupérer l'URL Minikube
   minikube service pokemon-app-service -n pokemon-app --url
   # Ou faire des curls
   for i in {1..50}; do curl -s $(minikube service pokemon-app-service -n pokemon-app --url)/; done
   ```

2. Ouvrir **Kiali** :
   - Graph > Sélectionner namespace `pokemon-app`.
   - Vous verrez le trafic entrant vers vos pods Pokemon.

3. Ouvrir **Grafana** :
   - Dashboards > Kubernetes / Compute Resources / Pod.

### ⚠️ Note Importante
L'application doit être redéployée **APRÈS** l'ajout du label `istio-injection=enabled` sur le namespace pour que les sidecars Envoy soient injectés. Le script `setup-observability.sh` ajoute ce label. Si vos pods n'ont pas de sidecar, supprimez-les pour forcer leur recréation :
```bash
kubectl delete pods --all -n pokemon-app
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
