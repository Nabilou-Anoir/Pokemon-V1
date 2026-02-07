#!/bin/bash

# ==============================================================================
# Script d'installation de la stack d'observabilité
# (Prometheus, Grafana, Istio, Kiali)
# Basé sur le TP "Monitoring + Service Mesh Observability sur Kubernetes"
# ==============================================================================

set -e # Arrêt en cas d'erreur

echo "🚀 Démarrage de l'installation de la stack d'observabilité..."

# ------------------------------------------------------------------------------
# 1. Prometheus + Grafana (kube-prometheus-stack)
# ------------------------------------------------------------------------------
echo "📦 [1/5] Installation de Prometheus + Grafana..."

# 1.1 Créer le namespace
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# 1.2 Ajouter le repo Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 1.3 Installer le chart
# Note : On utilise --wait pour s'assurer que les CRDs sont bien installés avant la suite
helm upgrade --install kube-prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --wait

echo "✅ Prometheus + Grafana installés."

# ------------------------------------------------------------------------------
# 4. Istio
# ------------------------------------------------------------------------------
echo "🕸️ [2/5] Installation d'Istio..."

# 4.1 Ajouter le repo Istio
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# 4.2 Créer le namespace
kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -

# 4.3 Installer Istio (Base + Istiod + Ingress)
helm upgrade --install istio-base istio/base -n istio-system
helm upgrade --install istiod istio/istiod -n istio-system --wait
helm upgrade --install istio-ingress istio/gateway -n istio-system --wait

echo "✅ Istio installé."

# 4.4 Activer la collecte des métriques Istio par Prometheus
echo "🔌 [3/5] Configuration Prometheus <-> Istio..."
helm upgrade kube-prom-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --reuse-values \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false

# Appliquer les ServiceMonitors pour Istio
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/addons/extras/prometheus-operator.yaml

echo "✅ Liaison Prometheus/Istio configurée."

# ------------------------------------------------------------------------------
# 5. Kiali
# ------------------------------------------------------------------------------
echo "🕵️ [4/5] Installation de Kiali..."

# 5.1 Ajouter le repo Kiali
helm repo add kiali https://kiali.org/helm-charts
helm repo update

# 5.2/5.3 Installer Kiali avec les liens vers Prometheus et Grafana
helm upgrade --install kiali-server kiali/kiali-server \
  --namespace istio-system \
  --set auth.strategy=anonymous \
  --set external_services.prometheus.url=http://kube-prom-stack-kube-prome-prometheus.monitoring:9090 \
  --set external_services.grafana.enabled=true \
  --set external_services.grafana.in_cluster_url=http://kube-prom-stack-grafana.monitoring \
  --set external_services.grafana.url=http://localhost:3000

echo "✅ Kiali installé."

# ------------------------------------------------------------------------------
# Configuration Application (Pokemon-App)
# ------------------------------------------------------------------------------
echo "🏷️ [5/5] Activation de l'injection Istio pour 'pokemon-app'..."

# Créer le namespace s'il n'existe pas
kubectl create namespace pokemon-app --dry-run=client -o yaml | kubectl apply -f -

# Ajouter le label pour l'injection sidecar envoy
kubectl label namespace pokemon-app istio-injection=enabled --overwrite

echo "✅ Namespace 'pokemon-app' configuré pour Istio."

echo "🎉 Installation terminée avec succès !"
echo "========================================================"
echo "Commandes pour accéder aux interfaces :"
echo ""
echo "📊 Grafana (admin / voir secret) :"
echo "   kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80"
echo "   -> http://localhost:3000"
echo ""
echo "📈 Prometheus :"
echo "   kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090"
echo "   -> http://localhost:9090"
echo ""
echo "🕸️ Kiali :"
echo "   kubectl port-forward -n istio-system svc/kiali 20001:20001"
echo "   -> http://localhost:20001"
echo "========================================================"
