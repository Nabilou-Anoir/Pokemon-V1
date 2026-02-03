{{/*
Labels communes pour tous les objets
*/}}
{{- define "pokemon-app.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: pokemon-app
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "pokemon-app.selectorLabels" -}}
app.kubernetes.io/name: pokemon-app
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
