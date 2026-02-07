# 🎮 Pokemon-V1 - Application Pokédex avec CI/CD (Jenkins + K8s + Helm)

Application web React permettant de rechercher et explorer les Pokémon, avec une chaîne CI/CD basée sur **Docker, Jenkins, Kubernetes, Helm** (Minikube).

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue)
![Helm](https://img.shields.io/badge/Helm-v3-purple)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-red)

---

## 📋 Table des matières

1. [Fonctionnalités](#-fonctionnalités)
2. [Architecture](#-architecture)
3. [Prérequis VM Ubuntu](#-prérequis-vm-ubuntu)
4. [Installation de l'environnement](#-installation-de-lenvironnement)
5. [Docker](#-docker)
6. [Jenkins CI/CD (Procédure complète A → Z)](#-jenkins-cicd-procédure-complète-a--z)
7. [Kubernetes avec Helm (manuel)](#-kubernetes-avec-helm-manuel)
8. [Monitoring (optionnel mais recommandé)](#-monitoring-optionnel-mais-recommandé)
9. [Structure du projet](#-structure-du-projet)
10. [Checklist du cahier des charges](#-checklist-du-cahier-des-charges)
11. [APIs utilisées](#-apis-utilisées)

---

## ✨ Fonctionnalités

- 🔍 **Recherche de Pokémon** - Recherche par nom avec détails complets
- 📚 **Pokédex par génération** - Navigation par génération (I à IX)
- 📖 **Pokédex complet** - Liste paginée de tous les Pokémon
- ✨ **Sprites shiny** - Visualisation des formes shiny

---

## 🏗 Architecture

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Jenkins   │────▶│ Docker Hub  │
└─────────────┘     └─────────────┘     └─────────────┘
│
▼
┌─────────────┐
│ Kubernetes  │
│ (Minikube)  │
└─────────────┘
│
▼
┌─────────────┐
│   Service   │
│ (NodePort)  │
└─────────────┘

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

Étape 2 : Installer Docker

sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

sudo usermod -aG docker $USER
newgrp docker

docker --version

Étape 3 : Installer Minikube

curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

minikube start --driver=docker --memory=4096 --cpus=2
minikube status

Étape 4 : Installer kubectl

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

kubectl version --client

Étape 5 : Installer Helm

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version


⸻

🐳 Docker

Construire l’image localement (test)

git clone https://github.com/Nabilou-Anoir/Pokemon-V1.git
cd Pokemon-V1

docker build -t pokemon-app:latest .

docker run -d -p 8080:80 --name pokemon-test pokemon-app:latest
curl -I http://localhost:8080 | head -n 10

docker stop pokemon-test && docker rm pokemon-test

Pousser sur Docker Hub (manuel)

docker login
docker tag pokemon-app:latest zouboupe/pokemon-app:latest
docker push zouboupe/pokemon-app:latest


⸻

🔄 Jenkins CI/CD (Procédure complète A → Z)

Objectif :
	•	Jenkins est installé dans Minikube (Helm)
	•	Jenkins exécute un pipeline Kubernetes (agent Pod)
	•	Build + Push de l’image Docker sur Docker Hub
	•	Déploiement / Mise à jour sur Kubernetes via Helm

A) Démarrer Minikube et vérifier l’état

minikube start --driver=docker --memory=4096 --cpus=2
minikube status
kubectl get nodes


⸻

B) Installer Jenkins dans Minikube (Helm)

helm repo add jenkins https://charts.jenkins.io
helm repo update

kubectl create namespace jenkins || true

helm install jenkins jenkins/jenkins \
  --namespace jenkins \
  --set controller.serviceType=NodePort

Donner les droits au service account Jenkins pour déployer dans le cluster :

kubectl create clusterrolebinding jenkins-admin-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins


⸻

C) Récupérer le mot de passe admin Jenkins

kubectl exec --namespace jenkins -it svc/jenkins -c jenkins -- \
  /bin/cat /run/secrets/additional/chart-admin-password && echo


⸻

D) Accéder à l’UI Jenkins

URL Jenkins :

minikube service jenkins -n jenkins --url

Ouvrir l’URL dans le navigateur, puis se connecter avec :
	•	username : admin
	•	password : (celui récupéré étape C)

Si un redémarrage de VM fait tomber Jenkins :
Relancer le pod Jenkins puis récupérer à nouveau l’URL.

kubectl get pods -n jenkins -o wide
kubectl delete pod -n jenkins jenkins-0
kubectl get pods -n jenkins -w
minikube service jenkins -n jenkins --url


⸻

E) Ajouter le token Docker Hub dans Jenkins
	1.	Docker Hub → Settings → Security → New Access Token
	2.	Jenkins → Manage Jenkins → Credentials → System → Global credentials → Add Credentials
	•	Kind : Secret text
	•	Secret : (Docker Hub Access Token)
	•	ID : dockerhub-token
	•	Description : DockerHub Token

⸻

F) Vérifier le Jenkinsfile du projet (important)

Le pipeline utilise un agent Kubernetes avec containers node, docker, helm, kubectl, jnlp.
Le container kubectl doit utiliser une image existante :

- name: kubectl
  image: alpine/kubectl:1.35.0

Vérification directe depuis la VM :

curl -sL https://raw.githubusercontent.com/Nabilou-Anoir/Pokemon-V1/main/Jenkinsfile | grep -n "image: .*kubectl"


⸻

G) Monitoring (si le chart contient un ServiceMonitor)

Le chart Helm contient un servicemonitor.yaml.
Dans ce cas, il faut installer les CRDs Prometheus Operator (kube-prometheus-stack) avant le déploiement Helm.

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring || true

helm install kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring

Vérifier que la CRD ServiceMonitor existe :

kubectl get crd | grep servicemonitors.monitoring.coreos.com


⸻

H) Créer le job Jenkins Pipeline

Dans Jenkins :
	1.	New Item
	2.	Nom : pokemon-v1
	3.	Type : Pipeline
	4.	Pipeline → Definition : Pipeline script from SCM
	5.	SCM : Git
	6.	Repository URL : https://github.com/Nabilou-Anoir/Pokemon-V1.git
	7.	Branch : */main
	8.	Script Path : Jenkinsfile
	9.	Save

⸻

I) Lancer le pipeline

Dans le job pokemon-v1 :
	•	Cliquez sur Build Now

Résultat attendu :
	•	Image Docker build + push :
	•	zouboupe/pokemon-app:<BUILD_NUMBER>
	•	zouboupe/pokemon-app:latest
	•	Déploiement Helm dans le namespace : pokemon-app
	•	Service NodePort : pokemon-app-service

⸻

J) Vérifier le déploiement et accéder à l’application

kubectl get all -n pokemon-app
kubectl get svc -n pokemon-app

URL application :

minikube service pokemon-app-service -n pokemon-app --url

Test :

curl -I $(minikube service pokemon-app-service -n pokemon-app --url) | head -n 10


⸻

K) Nettoyer les pods “agents Jenkins” (optionnel)

kubectl delete pod -n jenkins -l jenkins=pokemon-pipeline --ignore-not-found=true


⸻

☸️ Kubernetes avec Helm (manuel)

Cette partie permet de déployer sans Jenkins.
Dans la pratique, Jenkins fait déjà le helm install/upgrade.

Déployer (manuel)

kubectl create namespace pokemon-app || true

helm upgrade --install pokemon-app ./helm/pokemon-app \
  --namespace pokemon-app \
  --set image.repository=zouboupe/pokemon-app \
  --set image.tag=latest

Vérifier :

kubectl get pods -n pokemon-app
kubectl get svc -n pokemon-app
minikube service pokemon-app-service -n pokemon-app --url


⸻

📊 Monitoring (optionnel mais recommandé)

Accéder à Grafana

Mot de passe admin Grafana :

kubectl get secret -n monitoring kube-prom-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d; echo

Port-forward Grafana :

kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80

Accès : http://localhost:3000 (user: admin / password: commande ci-dessus)

⸻

📁 Structure du projet

Pokemon-V1/
├── src/                          # Code source React
├── helm/                         # Helm Chart
│   └── pokemon-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── servicemonitor.yaml
├── Dockerfile                    # Image Docker
├── Jenkinsfile                   # Pipeline CI/CD
├── nginx.conf                    # Config Nginx
└── README.md                     # Documentation


⸻

✅ Checklist du cahier des charges

Exigence	Status	Fichier(s)
Référentiel GitHub public	✅	-
Dockerfile fonctionnel	✅	Dockerfile, nginx.conf
Jenkins installé dans Minikube	✅	Helm chart Jenkins
Pipeline Jenkins CI/CD	✅	Jenkinsfile
Build + Push DockerHub	✅	Jenkinsfile
Déploiement Kubernetes	✅	helm/pokemon-app/templates/*
Service NodePort accessible	✅	helm/pokemon-app/templates/service.yaml
Monitoring (CRDs ServiceMonitor)	✅	kube-prometheus-stack


⸻

🔗 APIs utilisées
	•	Tyradex API￼ - Données Pokémon en français
	•	PokéAPI￼ - API REST Pokémon complète

Si tu veux, à la prochaine étape on pourra **ajouter ArgoCD proprement** (GitOps) dans le README, mais en gardant la même exigence : **procédure reproductible uniquement**, sans les blocages.
