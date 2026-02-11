# 🎮 Pokemon-V1 — Application Pokédex sur Kubernetes avec CI/CD

## 📖 Description du projet

**Pokemon-V1** est une application web **Pokédex** développée en **React** (avec **Vite**), permettant de parcourir les Pokémon par génération, de rechercher des Pokémon, et de consulter leurs détails.

L'application est conteneurisée avec **Docker** (servie par **Nginx**), déployée sur **Kubernetes** via **Helm** et **Argo CD** (GitOps), avec une pipeline CI/CD automatisée via **Jenkins**. Le monitoring est assuré par **Prometheus + Grafana** (kube-prometheus-stack).

### Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Serveur web | Nginx (alpine) |
| Conteneurisation | Docker (multi-stage build) |
| Orchestration | Kubernetes (Minikube) |
| Packaging K8s | Helm 3 |
| CI/CD | Jenkins (sur Kubernetes) |
| GitOps | Argo CD |
| Monitoring | Prometheus + Grafana (kube-prometheus-stack) |
| Métriques applicatives | nginx-prometheus-exporter (sidecar) |

### Architecture choisie : Monolithique

L'application suit une architecture **monolithique** : un seul conteneur Nginx sert le frontend React compilé, accompagné d'un sidecar `nginx-prometheus-exporter` pour exposer les métriques.

### Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Repository                              │
│                  https://github.com/Nabilou-Anoir/Pokemon-V1                │
└──────────┬──────────────────────────────────────────────────┬───────────────┘
           │                                                  │
           │ git clone / webhook                              │ sync (GitOps)
           ▼                                                  ▼
┌─────────────────────┐                            ┌─────────────────────┐
│      Jenkins        │                            │      Argo CD        │
│  (namespace jenkins)│                            │  (namespace argocd) │
│                     │                            │                     │
│ 1. Checkout code    │                            │ Surveille helm/     │
│ 2. npm ci           │                            │ pokemon-app/ dans   │
│ 3. docker build     │──── push image ─────┐      │ le repo GitHub      │
│ 4. docker push      │                     │      │                     │
│ 5. helm upgrade     │                     │      └────────┬──────────-─┘
│ 6. verify deploy    │                     │               │
└─────────────────────┘                     │               │ deploy
                                            ▼               ▼
                                  ┌───────────────────────────────┐
                                  │         Docker Hub            │
                                  │   zouboupe/pokemon-app:tag    │
                                  └──────────────┬────────────────┘
                                                 │ pull image
                                                 ▼
                            ┌──────────────────────────────────────┐
                            │    Kubernetes (namespace pokemon-app)│
                            │                                      │
                            │  ┌──────────────────────────────┐    │
                            │  │     Pod (x2 réplicas)        │    │
                            │  │                              │    │
                            │  │  ┌─────────────────────┐     │    │
                            │  │  │  pokemon-app        │     │    │
                            │  │  │  (Nginx + React)    │     │    │
                            │  │  │  Port 80            │     │    │
                            │  │  └─────────────────────┘     │    │
                            │  │  ┌─────────────────────┐     │    │
                            │  │  │  nginx-exporter     │     │    │
                            │  │  │  (sidecar)          │     │    │
                            │  │  │  Port 9113 /metrics │     │    │
                            │  │  └─────────────────────┘     │    │
                            │  └──────────────────────────────┘    │
                            │                                      │
                            │  Service NodePort (80 + 9113)        │
                            │  ServiceMonitor → Prometheus         │
                            └──────────────┬───────────────────────┘
                                           │
                                           │ scrape métriques
                                           ▼
                            ┌──────────────────────────────────────┐
                            │   Monitoring (namespace monitoring)  │
                            │                                      │
                            │   Prometheus ──► Grafana             │
                            │   (port 9090)    (port 3000)         │
                            │                                      │
                            │   Dashboards Kubernetes +            │
                            │   Métriques Nginx (connexions,       │
                            │   requêtes, etc.)                    │
                            │                                      │
                            │   Alertes : PokemonAppDown,          │
                            │   HighPodRestarts, HighCPU           │
                            └──────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
Pokemon-V1/
├── src/                          # Code source React
│   ├── App.jsx                   # Composant principal (routing)
│   ├── main.jsx                  # Point d'entrée React
│   ├── index.css                 # Styles globaux
│   ├── assets/                   # Images et ressources
│   └── component/                # Composants React
│       ├── Navbar.jsx            # Barre de navigation
│       ├── Search.jsx            # Recherche de Pokémon
│       ├── Search.css            # Styles recherche
│       ├── PokemonByGeneration.jsx  # Liste par génération
│       ├── ModalContent.jsx      # Modal détail Pokémon
│       └── pages/                # Pages de l'application
│           ├── Accueil.jsx       # Page d'accueil
│           ├── PokedexList.jsx   # Liste du Pokédex
│           └── NotFound.jsx      # Page 404
│
├── helm/
│   └── pokemon-app/              # Chart Helm de l'application
│       ├── Chart.yaml            # Métadonnées du chart
│       ├── values.yaml           # Valeurs par défaut
│       └── templates/
│           ├── _helpers.tpl      # Templates helpers (labels)
│           ├── deployment.yaml   # Deployment (app + sidecar exporter)
│           ├── service.yaml      # Service NodePort (ports 80 + 9113)
│           ├── ingress.yaml      # Ingress (optionnel)
│           ├── namespace.yaml    # Namespace pokemon-app
│           └── servicemonitor.yaml  # ServiceMonitor Prometheus
│
├── argocd/
│   ├── application.yaml          # Application ArgoCD (complète)
│   └── pokemon-app.yaml          # Application ArgoCD (simplifiée)
│
├── monitoring/
│   └── prometheus-rules.yaml     # Règles d'alertes Prometheus (bonus)
│
├── jenkins/
│   └── values.yaml               # Plugins Jenkins (Helm values)
│
├── Dockerfile                    # Image Docker multi-stage
├── nginx.conf                    # Configuration Nginx (SPA + stub_status)
├── Jenkinsfile                   # Pipeline CI/CD Jenkins
├── jenkins-rbac.yaml             # RBAC Kubernetes pour Jenkins
├── package.json                  # Dépendances Node.js
├── vite.config.js                # Configuration Vite
├── tailwind.config.js            # Configuration TailwindCSS
├── eslint.config.js              # Configuration ESLint
├── postcss.config.js             # Configuration PostCSS
├── .dockerignore                 # Exclusions Docker
├── .gitignore                    # Exclusions Git
└── README.md                     # Ce fichier
```

---

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Installation de l'environnement](#️-installation-de-lenvironnement)
- [Préparation Docker Hub](#-préparation-docker-hub)
- [Installation de Jenkins](#-installation-de-jenkins)
- [Configuration du Pipeline CI/CD](#-configuration-du-pipeline-cicd)
- [Déploiement GitOps avec Argo CD](#-déploiement-gitops-avec-argo-cd)
- [Monitoring (Prometheus + Grafana)](#-monitoring-prometheus--grafana)
- [Accès à l'application](#-accès-à-lapplication)
- [Dépannage](#-dépannage)

---

## 🔧 Prérequis

- Connexion Internet
- Compte [Docker Hub](https://hub.docker.com) (gratuit)

---

## 🏗️ Installation de l'environnement

### 1) Mise à jour système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2) Installation de Docker

```bash
# Installation des dépendances
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Ajout de la clé GPG Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajout du dépôt Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installation Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Ajout de l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Vérification
docker --version
```

### 3) Installation de Minikube

```bash
# Téléchargement et installation
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Démarrage de Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Vérification
minikube status
```

> **💡 Astuce** : Si vous avez 8 Go de RAM ou plus, augmentez la mémoire :
> ```bash
> minikube start --driver=docker --memory=6144 --cpus=2
> ```

### 4) Installation de kubectl

```bash
# Téléchargement de la dernière version stable
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Installation
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Vérification
kubectl version --client
```

### 5) Installation de Helm

```bash
# Installation via script officiel
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Vérification
helm version
```

---

## 🔐 Préparation Docker Hub

Le pipeline Jenkins publie les images Docker sur Docker Hub. Vous devez créer un token d'accès :

1. Créer un compte sur [Docker Hub](https://hub.docker.com) (si nécessaire)
2. Aller dans **Account Settings** → **Security** → **New Access Token**
3. Créer un token avec les permissions **Read, Write, Delete**
4. **⚠️ Copier le token immédiatement** (il ne sera plus visible après)

> Conservez ce token, il sera utilisé dans Jenkins.

---

## 🧰 Installation de Jenkins

### 1) Installation via Helm

```bash
# Ajout du dépôt Helm Jenkins
helm repo add jenkins https://charts.jenkins.io
helm repo update

# Création du namespace
kubectl create namespace jenkins

# Installation de Jenkins avec les plugins préconfigurés
helm install jenkins jenkins/jenkins \
  --namespace jenkins \
  --set controller.serviceType=NodePort \
  -f jenkins/values.yaml
```

> **📝 Note** : Le fichier `jenkins/values.yaml` préinstalle automatiquement les plugins suivants :
> - `workflow-aggregator` (Pipeline)
> - `git`
> - `docker-workflow` (Docker Pipeline)
> - `kubernetes-cli`
> - `credentials-binding`

### 2) Attribution des droits RBAC à Jenkins

Jenkins a besoin de permissions pour déployer dans le cluster. Appliquez le fichier `jenkins-rbac.yaml` fourni :

```bash
kubectl apply -f jenkins-rbac.yaml
```

Ce fichier crée un `ClusterRoleBinding` qui donne au ServiceAccount `jenkins` (namespace `jenkins`) le rôle `cluster-admin`.

### 3) Accès à l'interface Jenkins

**Récupérer le mot de passe admin :**

```bash
kubectl exec --namespace jenkins -it svc/jenkins -c jenkins -- \
  /bin/cat /run/secrets/additional/chart-admin-password && echo
```

**Obtenir l'URL Jenkins :**

```bash
minikube service jenkins -n jenkins --url
```

Ouvrir l'URL dans le navigateur :
- **Username** : `admin`
- **Password** : celui récupéré avec la commande précédente

### 4) Vérification des plugins Jenkins

Les plugins sont normalement installés automatiquement via `jenkins/values.yaml`. Si ce n'est pas le cas :

1. Aller dans **Manage Jenkins** → **Plugins** → **Available plugins**
2. Installer les plugins suivants :
   - **Pipeline** (workflow-aggregator)
   - **Git**
   - **Docker Pipeline** (docker-workflow)
   - **Kubernetes CLI** (kubernetes-cli)
   - **Credentials Binding**
3. Redémarrer Jenkins si demandé

### 5) Ajout des credentials Docker Hub

1. **Manage Jenkins** → **Credentials** → **System** → **Global credentials** → **Add Credentials**
2. Configurer :
   - **Kind** : `Secret text`
   - **Secret** : *Coller votre token Docker Hub*
   - **ID** : `dockerhub-token`
   - **Description** : `DockerHub Token`
3. Cliquer sur **Create**

---

## ✅ Configuration du Pipeline CI/CD

### A) Cloner le projet

```bash
cd ~
git clone https://github.com/Nabilou-Anoir/Pokemon-V1.git
cd Pokemon-V1
```

### B) Installation des CRDs Prometheus (obligatoire avant le pipeline)

Le chart Helm utilise un `ServiceMonitor` pour le monitoring. Il faut installer les CRDs avant le premier build :

```bash
# Ajout du dépôt Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Création du namespace
kubectl create namespace monitoring

# Installation de kube-prometheus-stack
helm install kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring

# Vérification de la CRD
kubectl get crd | grep servicemonitors.monitoring.coreos.com
```

**✅ Résultat attendu :** Une ligne contenant `servicemonitors.monitoring.coreos.com`

### C) Création du job Pipeline dans Jenkins

1. Ouvrir Jenkins → **New Item**
2. **Item name** : `pokemon-v1`
3. **Type** : `Pipeline`
4. **Pipeline** → **Definition** : `Pipeline script from SCM`
5. **SCM** : `Git`
6. **Repository URL** : `https://github.com/Nabilou-Anoir/Pokemon-V1.git`
7. **Branch Specifier** : `*/main`
8. **Script Path** : `Jenkinsfile`
9. Cliquer sur **Save**

### D) Lancer le build

1. Aller dans le job `pokemon-v1`
2. Cliquer sur **Build Now**
3. Suivre la progression dans **Console Output**

**🔄 Étapes du pipeline (Jenkinsfile) :**

| Étape | Description |
|---|---|
| **1. Checkout** | Récupération du code source depuis GitHub |
| **2. Install Dependencies** | Installation des dépendances (`npm ci`) dans le container `node` |
| **3. Build Docker Image** | Construction de l'image Docker multi-stage + tag `latest` (container `docker`) |
| **4. Push to Docker Hub** | Publication de l'image `zouboupe/pokemon-app:<BUILD_NUMBER>` + `latest` |
| **5. Deploy with Helm** | `helm upgrade --install pokemon-app ./helm/pokemon-app` dans le namespace `pokemon-app` |
| **6. Verify Deployment** | `kubectl rollout status` + listing des pods et services |

> **📝 Note** : Le pipeline utilise un pod Kubernetes avec 4 containers spécialisés (`node`, `docker`, `helm`, `kubectl`) et poll le SCM toutes les 5 minutes (`*/5 * * * *`).

**✅ Build réussi :** Toutes les étapes doivent être vertes

---

## 🚀 Déploiement GitOps avec Argo CD

### Prérequis

- Cluster Kubernetes fonctionnel
- Le chart Helm doit être dans le dépôt : `helm/pokemon-app/`

> **⚠️ Important** : Argo CD déploie depuis l'URL Git, pas depuis le dossier local cloné.

### 1) Installation d'Argo CD

```bash
# Création du namespace
kubectl create namespace argocd

# Installation d'Argo CD
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que tous les pods soient prêts
kubectl -n argocd get pods -w
```

### 2) Accès à l'interface Argo CD

**Port-forward pour accéder à l'UI :**

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

**Récupérer le mot de passe admin :**

```bash
echo "Username: admin"
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d ; echo
```

Ouvrir dans le navigateur : **https://localhost:8080**

### 3) Création de l'Application Argo CD

**Méthode 1 : Via kubectl avec le fichier fourni (recommandé)**

```bash
kubectl apply -f argocd/pokemon-app.yaml
```

Ce fichier `argocd/pokemon-app.yaml` configure :
- **Source** : repo GitHub `Nabilou-Anoir/Pokemon-V1.git`, branche `main`, chemin `helm/pokemon-app`
- **Destination** : namespace `pokemon-app`
- **Sync Policy** : automatique avec `prune` et `selfHeal`
- **Image** : `zouboupe/pokemon-app`

**Méthode 2 : Via l'interface web**

1. Cliquer sur **+ NEW APP**
2. Configurer :
   - **Application Name** : `pokemon-app`
   - **Project** : `default`
   - **Sync Policy** : `Automatic`
   - **Repository URL** : `https://github.com/Nabilou-Anoir/Pokemon-V1.git`
   - **Revision** : `main`
   - **Path** : `helm/pokemon-app`
   - **Cluster URL** : `https://kubernetes.default.svc`
   - **Namespace** : `pokemon-app`
3. Cliquer sur **CREATE**

### 4) Vérification du déploiement

```bash
# Vérifier l'application dans Argo CD
kubectl -n argocd get application pokemon-app -o wide

# Vérifier les ressources déployées
kubectl -n pokemon-app get all
```

**✅ Résultats attendus :**
- **SYNC STATUS** : `Synced`
- **HEALTH STATUS** : `Healthy`

---

## 📊 Monitoring (Prometheus + Grafana)

### 1) Installation de kube-prometheus-stack

Si non déjà fait (voir section Pipeline CI/CD) :

```bash
# Namespace monitoring
kubectl create namespace monitoring

# Ajout du dépôt
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Installation
helm install kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring

# Configuration pour découvrir tous les ServiceMonitors (tous namespaces)
helm upgrade kube-prom-stack prometheus-community/kube-prometheus-stack -n monitoring \
  --reuse-values \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.serviceMonitorNamespaceSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorNamespaceSelectorNilUsesHelmValues=false

# Vérification
kubectl -n monitoring get pods
```

### 2) Vérification du ServiceMonitor

```bash
# Vérifier que le ServiceMonitor existe
kubectl -n pokemon-app get servicemonitor

# Vérifier les endpoints du service
kubectl -n pokemon-app get svc pokemon-app-service -o wide
```

**✅ Le service expose 2 ports :**
- Port **80** → application web (Nginx + React)
- Port **9113** → métriques nginx-prometheus-exporter (sidecar)

### 3) Test de l'endpoint métriques

```bash
# Port-forward sur le port metrics du service
kubectl -n pokemon-app port-forward svc/pokemon-app-service 9113:9113
```

**Dans un autre terminal :**

```bash
curl -s http://localhost:9113/metrics | head -n 30
```

**✅ Résultat attendu :** Des métriques Prometheus (lignes commençant par `nginx_`, `go_`, `promhttp_`, etc.)

### 4) Accès à Prometheus

```bash
# Port-forward Prometheus
kubectl -n monitoring port-forward svc/kube-prom-stack-kube-prome-prometheus 9090:9090
```

Ouvrir : **http://localhost:9090**

**Vérification des targets :**
1. Aller dans **Status** → **Targets**
2. Rechercher `pokemon-app`
3. Vérifier que le target est **UP** (endpoint `:9113/metrics`)

### 5) Accès à Grafana

**Récupérer le mot de passe admin :**

```bash
kubectl -n monitoring get secret kube-prom-stack-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d ; echo
```

**Port-forward Grafana :**

```bash
kubectl -n monitoring port-forward svc/kube-prom-stack-grafana 3000:80
```

Ouvrir : **http://localhost:3000**

**Login :**
- **Username** : `admin`
- **Password** : (celui récupéré précédemment)

**Dashboards disponibles :**
- **Dashboards** → **Browse** → Plusieurs dashboards préinstallés :
  - Kubernetes / Compute Resources / Cluster
  - Kubernetes / Compute Resources / Namespace (Pods)
  - Kubernetes / Networking / Cluster
  - etc.

### 6) Requêtes PromQL de test

Dans Prometheus (**http://localhost:9090**) → onglet **Graph** :

```promql
# Vérifier que la cible est active
up{namespace="pokemon-app"}

# Nombre de connexions NGINX actives
nginx_connections_active

# Nombre total de connexions acceptées par NGINX
nginx_connections_accepted

# Requêtes HTTP traitées par NGINX
nginx_http_requests_total

# Taux de requêtes sur l'exporter
rate(promhttp_metric_handler_requests_total[5m])
```

### 7) Alertes Prometheus (Bonus)

Le fichier `monitoring/prometheus-rules.yaml` définit **3 règles d'alertes** :

| Alerte | Seuil | Sévérité |
|---|---|---|
| **PokemonAppDown** | Service down pendant > 1 min | 🔴 critical |
| **PokemonAppHighPodRestarts** | > 3 restarts en 1h | 🟡 warning |
| **PokemonAppHighCPU** | CPU > 80% pendant > 5 min | 🟡 warning |

**Pour appliquer les alertes :**

```bash
kubectl apply -f monitoring/prometheus-rules.yaml
```

**Vérification :**

```bash
# Vérifier que la règle est créée
kubectl -n pokemon-app get prometheusrule

# Vérifier dans Prometheus UI : Status → Rules
```

### ✅ Validation du monitoring

- ✅ Prometheus collecte les métriques du cluster (nodes, pods, etc.)
- ✅ Grafana accessible avec dashboards Kubernetes préinstallés
- ✅ ServiceMonitor détecté et target UP
- ✅ Métriques applicatives nginx-prometheus-exporter disponibles (connexions, requêtes HTTP)
- ✅ Alertes Prometheus configurées (bonus)

---

## 🌐 Accès à l'application

### 1) Vérification de l'état

```bash
# Vérifier les pods
kubectl get pods -n pokemon-app -o wide

# Vérifier les services
kubectl get svc -n pokemon-app
```

### 2) Obtenir l'URL de l'application

```bash
minikube service pokemon-app-service -n pokemon-app --url
```

**Ouvrir l'URL dans un navigateur**

### 3) Test en ligne de commande

```bash
curl -I $(minikube service pokemon-app-service -n pokemon-app --url)
```

**✅ Résultat attendu :** `HTTP/1.1 200 OK`

---

## 🔧 Dépannage

### Jenkins ne répond plus après redémarrage

```bash
# Lister les pods Jenkins
kubectl get pods -n jenkins -o wide

# Redémarrer le pod
kubectl delete pod -n jenkins jenkins-0

# Attendre le redémarrage
kubectl get pods -n jenkins -w

# Récupérer la nouvelle URL
minikube service jenkins -n jenkins --url
```

### Argo CD repo-server en erreur

```bash
kubectl -n argocd rollout restart deployment argocd-repo-server
kubectl -n argocd get pods -w
```

### L'application ne démarre pas

```bash
# Vérifier les logs du pod
kubectl -n pokemon-app logs -l app.kubernetes.io/name=pokemon-app --tail=100

# Vérifier les events
kubectl -n pokemon-app get events --sort-by='.lastTimestamp'

# Décrire un pod problématique
kubectl -n pokemon-app describe pod <pod-name>
```

### Prometheus ne scrape pas les métriques

```bash
# Vérifier le ServiceMonitor
kubectl -n pokemon-app get servicemonitor -o yaml

# Vérifier que Prometheus découvre tous les ServiceMonitors
kubectl -n monitoring get prometheus -o yaml | grep -A 10 serviceMonitor

# Redémarrer Prometheus si nécessaire
kubectl -n monitoring rollout restart statefulset prometheus-kube-prom-stack-kube-prome-prometheus
```

### Minikube ne démarre pas

```bash
# Supprimer et recréer le cluster
minikube delete
minikube start --driver=docker --memory=6144 --cpus=2

# Vérifier les logs
minikube logs
```

---

## 📝 Notes importantes

- **Ressources système** : Minikube nécessite au moins 4 Go de RAM. Pour une expérience optimale, utilisez 6-8 Go.
- **Docker Hub** : L'image est publiée sous `zouboupe/pokemon-app`. Assurez-vous que votre token a les permissions nécessaires (Read, Write, Delete).
- **Namespaces** :
  - `pokemon-app` → Application
  - `jenkins` → Jenkins
  - `monitoring` → Prometheus + Grafana
  - `argocd` → Argo CD
- **Port-forwards** : Les port-forwards sont temporaires. Relancez-les après un redémarrage de terminal.
- **Argo CD** : Utilise le dépôt Git comme source de vérité. Les modifications locales ne seront pas détectées.

---

## ✅ Checklist de validation

- [ ] Minikube démarre sans erreur
- [ ] Jenkins accessible et configuré
- [ ] Pipeline Jenkins s'exécute avec succès (6 étapes)
- [ ] Image Docker publiée sur Docker Hub (`zouboupe/pokemon-app`)
- [ ] Application déployée dans Kubernetes (namespace `pokemon-app`)
- [ ] Application accessible via navigateur (page Pokédex)
- [ ] Argo CD synchronisé et healthy
- [ ] Prometheus collecte les métriques du cluster
- [ ] Grafana accessible avec dashboards Kubernetes
- [ ] ServiceMonitor Prometheus détecté et target UP
- [ ] Métriques nginx (connexions, requêtes) disponibles
- [ ] Alertes Prometheus appliquées (bonus)

---

**Auteur** : Nabilou-Anoir  
**Projet** : Pokemon-V1 — Application Pokédex  
**Repository** : https://github.com/Nabilou-Anoir/Pokemon-V1
