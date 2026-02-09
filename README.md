# 🎮 Pokemon-V1 — Pokédex React avec CI/CD (Jenkins + Docker + Kubernetes + Helm) + Monitoring

Application web React permettant de rechercher et explorer les Pokémon, avec une chaîne CI/CD **reproductible** basée sur **Docker, Jenkins, Kubernetes (Minikube) et Helm**.  
Le chart Helm inclut un **ServiceMonitor**, donc on installe aussi **Prometheus Operator (kube-prometheus-stack)** pour que le déploiement fonctionne.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-blue)
![Helm](https://img.shields.io/badge/Helm-v3-purple)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-red)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-red)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-orange)

---

## 📋 Table des matières

1. [Fonctionnalités](#-fonctionnalités)
2. [Architecture](#-architecture)
3. [Prérequis VM Ubuntu](#-prérequis-vm-ubuntu)
4. [Installation de l’environnement](#-installation-de-lenvironnement)
5. [Préparation Docker Hub](#-préparation-docker-hub)
6. [Installation de Jenkins dans Kubernetes](#-installation-de-jenkins-dans-kubernetes)
7. [Accéder à l’UI Jenkins](#-accéder-à-lui-jenkins)
8. [Configurer Jenkins (plugins + credentials)](#-configurer-jenkins-plugins--credentials)
9. [Pipeline Jenkins : procédure complète (A → Z)](#-pipeline-jenkins--procédure-complète-a--z)
10. [Déploiement & accès à l’application](#-déploiement--accès-à-lapplication)
11. [Monitoring Prometheus + Grafana (nécessaire pour ServiceMonitor)](#-monitoring-prometheus--grafana-nécessaire-pour-servicemonitor)
12. [Structure du projet](#-structure-du-projet)
13. [Checklist](#-checklist)
14. [APIs utilisées](#-apis-utilisées)

---

## ✨ Fonctionnalités

- 🔍 **Recherche de Pokémon** (nom + détails)
- 📚 **Pokédex par génération** (I → IX)
- 📖 **Liste paginée** des Pokémon
- ✨ **Sprites shiny**

---

## 🏗 Architecture

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Jenkins   │────▶│ Docker Hub  │
└─────────────┘     └─────────────┘     └─────────────┘
│
▼
┌─────────────┐
│ Kubernetes  │
│  Minikube   │
└─────────────┘
│
▼
┌─────────────┐
│  Service    │
│  NodePort   │
└─────────────┘
│
▼
┌─────────────┐
│ Navigateur  │
└─────────────┘

---

## 🖥 Prérequis VM Ubuntu

Recommandé (sinon la VM peut redémarrer pendant les builds) :
- **RAM** : 8 Go (minimum 4 Go)
- **CPU** : 2 cœurs (4 conseillé)
- **Disque** : 20 Go+
- **Ubuntu** : 20.04 / 22.04 / 24.04

---

## 🔧 Installation de l’environnement

### 1) Mise à jour système

```bash
sudo apt update && sudo apt upgrade -y

2) Installer Docker

sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

sudo usermod -aG docker $USER
newgrp docker

docker --version

3) Installer Minikube

curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

minikube start --driver=docker --memory=4096 --cpus=2
minikube status

Astuce : si vous avez 8 Go RAM, vous pouvez monter la mémoire :

minikube start --driver=docker --memory=6144 --cpus=2

4) Installer kubectl

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

kubectl version --client

5) Installer Helm

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version


⸻

🔐 Préparation Docker Hub

Le pipeline Jenkins push l’image sur Docker Hub.
Il faut donc :
	1.	un compte Docker Hub
	2.	un Access Token (recommandé plutôt que mot de passe)

Créer un token Docker Hub

Docker Hub → Account Settings → Security → New Access Token
Copier le token, on l’ajoutera dans Jenkins ensuite.

⸻

🧰 Installation de Jenkins dans Kubernetes

On installe Jenkins dans Minikube via Helm.

helm repo add jenkins https://charts.jenkins.io
helm repo update

kubectl create namespace jenkins || true

helm install jenkins jenkins/jenkins \
  --namespace jenkins \
  --set controller.serviceType=NodePort

Donner les droits nécessaires à Jenkins

Jenkins doit pouvoir faire kubectl / helm dans le cluster.

<<<<<<< Updated upstream
kubectl create clusterrolebinding jenkins-admin-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins
=======
# Note : La configuration des droits RBAC est détaillée à l'étape 8
```
>>>>>>> Stashed changes


<<<<<<< Updated upstream
⸻
=======
### Étape 7 : Installer les plugins Jenkins (Via Helm)

Avec Jenkins installé via le chart Helm `jenkins/jenkins`, l’installation des plugins se fait de façon déclarative via un fichier values (au lieu d’un assistant interactif).
On ajoute ici les plugins minimum pour un pipeline CI/CD Docker + Kubernetes.

✅ **Plugins requis**

- `workflow-aggregator` (Pipeline)
- `git` (SCM Git)
- `docker-workflow` (Docker Pipeline)
- `kubernetes-cli` (kubectl depuis Jenkins)
- `credentials-binding` (gestion des credentials dans les pipelines)

#### 1) Créer un fichier values pour Jenkins

```bash
cat > ~/jenkins-values.yaml <<'EOF'
controller:
  installPlugins:
    - workflow-aggregator
    - git
    - docker-workflow
    - kubernetes-cli
    - credentials-binding
EOF
```

#### 2) Appliquer la config à Jenkins (upgrade Helm)

```bash
helm upgrade jenkins jenkins/jenkins -n jenkins -f ~/jenkins-values.yaml
```

#### 3) Attendre que Jenkins redémarre

```bash
kubectl rollout status -n jenkins statefulset/jenkins
kubectl get pods -n jenkins
```

#### 4) Vérifier que les plugins sont bien installés

```bash
kubectl exec -n jenkins jenkins-0 -c jenkins -- bash -lc '
for p in docker-workflow kubernetes-cli; do
  if [ -e "/var/jenkins_home/plugins/$p.jpi" ] || [ -d "/var/jenkins_home/plugins/$p" ]; then
    echo "OK  - $p"
  else
    echo "MISS- $p"
  fi
done
'
```

> **⚠️ Remarque** : Jenkins doit avoir un accès réseau sortant vers `updates.jenkins.io` pour télécharger les plugins. Si l’installation échoue, vérifiez DNS/proxy/réseau du cluster.

### Étape 8 : Donner les droits Kubernetes à Jenkins (RBAC)

Par défaut, Jenkins (installé via Helm dans le namespace `jenkins`) n’a pas forcément les droits nécessaires pour créer/modifier des ressources Kubernetes.
Pour que le pipeline puisse déployer l’application dans le cluster Minikube, on donne au service account de Jenkins des droits `cluster-admin`.

✅ **Créer le ClusterRoleBinding**

```bash
kubectl create clusterrolebinding jenkins-admin-binding \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins
```

🔎 **Vérifier que c’est en place**

```bash
kubectl get clusterrolebinding | grep jenkins-admin-binding
```
Si vous obtenez une ligne avec `jenkins-admin-binding`, c’est bon.

#### 🛠 Dépannage

- Si vous voyez `Error from server (AlreadyExists)` : c’est OK, la règle existe déjà.
- Si Jenkins a encore des erreurs "Forbidden" pendant le déploiement :
  - Vérifiez que le namespace est bien `jenkins`
  - Vérifiez le service account utilisé : `jenkins:jenkins`

> **⚠️ Note sécurité** : `cluster-admin` est pratique pour un projet/TP (Minikube) mais trop permissif en production. En prod, on crée un rôle RBAC plus restrictif limité aux ressources nécessaires.

---
>>>>>>> Stashed changes

🌐 Accéder à l’UI Jenkins

1) Récupérer le mot de passe admin

kubectl exec --namespace jenkins -it svc/jenkins -c jenkins -- \
  /bin/cat /run/secrets/additional/chart-admin-password && echo

2) Obtenir l’URL Jenkins

minikube service jenkins -n jenkins --url

Ouvrir l’URL dans le navigateur :
	•	username : admin
	•	password : celui récupéré avec la commande précédente

3) Si Jenkins ne répond plus (après redémarrage VM)

Redémarrer le pod Jenkins :

kubectl get pods -n jenkins -o wide
kubectl delete pod -n jenkins jenkins-0
kubectl get pods -n jenkins -w
minikube service jenkins -n jenkins --url


⸻

🧩 Configurer Jenkins (plugins + credentials)

Plugins à installer (si non déjà installés)

Dans Jenkins : Manage Jenkins → Plugins
Installer au minimum :
	•	Pipeline
	•	Git
	•	Kubernetes
	•	Docker Pipeline (utile)
	•	Credentials Binding (souvent déjà présent)

Ajouter le token Docker Hub

Jenkins → Manage Jenkins → Credentials → System → Global credentials → Add Credentials
	•	Kind : Secret text
	•	Secret : (Docker Hub Access Token)
	•	ID : dockerhub-token
	•	Description : DockerHub Token

⸻

✅ Pipeline Jenkins : procédure complète (A → Z)

A) Cloner le projet (sur la VM)

git clone https://github.com/Nabilou-Anoir/Pokemon-V1.git
cd Pokemon-V1

B) Vérifier le Jenkinsfile (image kubectl)

Le pipeline utilise un agent Kubernetes avec un container kubectl.
L’image doit exister : on utilise alpine/kubectl:1.35.0.

Vérification depuis GitHub :

curl -sL https://raw.githubusercontent.com/Nabilou-Anoir/Pokemon-V1/main/Jenkinsfile | grep -n "image: .*kubectl"

Résultat attendu :

image: alpine/kubectl:1.35.0

Pourquoi : sinon l’agent Jenkins ne démarre pas si l’image n’existe pas.

C) (Obligatoire si ServiceMonitor) Installer Prometheus Operator / CRDs

Notre chart Helm inclut un ServiceMonitor (monitoring.coreos.com/v1).
Donc on doit installer les CRDs via kube-prometheus-stack avant de déployer l’app.

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring || true

<<<<<<< Updated upstream
helm install kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring

Vérifier la CRD :
=======
### Étape 2 : Vérification des plugins

Si vous avez suivi l'**Étape 7**, les plugins sont déjà installés. 
Sinon, allez dans **Manage Jenkins** > **Plugins** > **Available plugins** et installez :
- Docker Pipeline
- Git
- Pipeline
- Kubernetes CLI
>>>>>>> Stashed changes

kubectl get crd | grep servicemonitors.monitoring.coreos.com

D) Créer le job Pipeline dans Jenkins
	1.	Jenkins → New Item
	2.	Nom : pokemon-v1
	3.	Type : Pipeline
	4.	Pipeline → Definition : Pipeline script from SCM
	5.	SCM : Git
	6.	Repository URL : https://github.com/Nabilou-Anoir/Pokemon-V1.git
	7.	Branch : */main
	8.	Script Path : Jenkinsfile
	9.	Save

E) Lancer le build

Dans pokemon-v1 → Build Now

Ce que fait le pipeline (résumé clair) :
	1.	Checkout GitHub
	2.	npm ci + build front
	3.	docker build → image taggée avec le numéro du build
	4.	docker login (token) puis push Docker Hub
	5.	helm install ou helm upgrade sur le namespace pokemon-app
	6.	Vérification kubectl rollout status

⸻

🚀 Déploiement & accès à l’application

1) Vérifier l’état Kubernetes

kubectl get pods -n pokemon-app -o wide
kubectl get svc  -n pokemon-app

2) Obtenir l’URL du service

minikube service pokemon-app-service -n pokemon-app --url

3) Tester en ligne de commande

curl -I $(minikube service pokemon-app-service -n pokemon-app --url) | head -n 10

Attendu : HTTP/1.1 200 OK

⸻

📊 Monitoring Prometheus + Grafana (nécessaire pour ServiceMonitor)

Cette partie est déjà requise pour que le chart Helm fonctionne si ServiceMonitor est déployé.

Vérifier les pods Prometheus stack

kubectl -n monitoring get pods -l release=kube-prom-stack

Accéder à Grafana

Récupérer le mot de passe :

kubectl --namespace monitoring get secrets kube-prom-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d ; echo

Port-forward :

kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80

Accès :
	•	URL : http://localhost:3000
	•	user : admin
	•	password : commande ci-dessus

⸻

📁 Structure du projet

Pokemon-V1/
├── src/                          # Code source React
├── helm/
│   └── pokemon-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           └── servicemonitor.yaml
├── Dockerfile
├── Jenkinsfile
├── nginx.conf
└── README.md


⸻

✅ Checklist

Exigence	Status	Où ?
Repo GitHub public	✅	GitHub
Dockerfile fonctionnel	✅	Dockerfile, nginx.conf
Jenkins dans K8s	✅	Helm chart jenkins/jenkins
Pipeline CI/CD	✅	Jenkinsfile
Build + push Docker Hub	✅	Jenkinsfile
Déploiement K8s	✅	Helm (helm/pokemon-app)
Service NodePort	✅	service.yaml
Monitoring (ServiceMonitor)	✅	kube-prometheus-stack


⸻

🔗 APIs utilisées
	•	Tyradex API￼ — Données Pokémon en français
	•	PokéAPI￼ — API REST Pokémon complète

### Petite recommandation (sans modifier le fond)
- Pour que ton prof **reproduise sans surprise**, tu peux garder exactement ce README et ensuite on ajoutera **ArgoCD** dans une section dédiée, avec les commandes d’installation et un `Application.yaml` complet.

Si tu veux, colle-moi ton `Jenkinsfile` actuel (ou au moins les variables / stages), et je te l’aligne parfaitement avec le README (noms du job, ID credentials, tags Docker, namespaces).
