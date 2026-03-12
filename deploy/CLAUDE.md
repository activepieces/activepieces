# Kubernetes Infrastructure Guide

We control the prod / staging clusters through 
ssh <ssh_user>@<control_plane_ip_for_prod/stg> cat /etc/rancher/k3s/k3s.yaml | sed 's/127.0.0.1/<control_plane_ip_for_prod/stg>/g' > ~/.kube/config

## Terraform Setup

State is stored remotely in Hetzner Object Storage. Each environment uses a separate Terraform workspace so state is fully isolated.

### First-time init (run once per machine)

```bash
cd /root/k8s/deploy/terraform/hetzner

# Export S3 credentials for the remote backend (Hetzner Object Storage)
export AWS_ACCESS_KEY_ID=<hetzner-s3-access-key>
export AWS_SECRET_ACCESS_KEY=<hetzner-s3-secret-key>

terraform init

# Create workspaces (one-time)
terraform workspace new prod
terraform workspace new stg
```

### Apply per environment

```bash
# Staging
terraform workspace select stg
terraform apply -var-file="terraform-stg.tfvars"

# Production
terraform workspace select prod
terraform apply -var-file="terraform-prod.tfvars"
```

State is stored at `env:/<workspace>/hetzner/terraform.tfstate` in the `activepieces-tf-state` bucket.

tfvars template:
```hcl
hcloud_token   = ""                         # Hetzner Cloud project API token (separate project per env)
ssh_public_key = ""                         # devops machine ssh key

cluster_name = ""                           # Prefix for all resource names (e.g. "activepieces-staging")
location     = ""                           # Hetzner datacenter (e.g. nbg1, fsn1, hel1, ash)
network_zone = ""                           # eu-central for nbg1/fsn1/hel1, us-east for ash

object_storage_location = ""                # fsn1 or nbg1

control_plane_server_type = ""              # e.g. cx23 (2 vCPU, 4GB)
app_server_type           = ""              # e.g. cx33 (2 vCPU, 4GB)
app_node_count            = 0

worker_server_type = ""                     # e.g. cx43 (4 vCPU, 8GB)
worker_node_count  = 0

s3_bucket_name = ""                         # created manually

load_balancer_type = ""                     # e.g. lb11
```

## K8s Setup

Create helm values.yaml files for app and worker (e.g. deploy/staging/).

```bash
# Get control plane IP
terraform output control_plane_ip

# Copy cluster config
ssh <ssh_user>@<control_plane_ip_for_prod/stg> cat /etc/rancher/k3s/k3s.yaml | sed 's/127.0.0.1/<control_plane_ip_for_prod/stg>/g' > ~/.kube/config

# Check running nodes
kubectl get nodes
```

### Install kubectl-argo-rollouts plugin if not exist

```bash
curl -fsSL https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64 \
  -o /usr/local/bin/kubectl-argo-rollouts
chmod +x /usr/local/bin/kubectl-argo-rollouts
```

### Setup Argo Rollouts ( first time only )

```bash
helm upgrade --install argo-rollouts argo-rollouts \
  --repo https://argoproj.github.io/argo-helm \
  --namespace argo-rollouts --create-namespace \
  --wait --timeout 5m
```

### Create Secrets

```bash
# Apply all secrets from your env file (see deploy/scripts/apply-secrets.sh)
./deploy/scripts/apply-secrets.sh --env-file .env.* --namespace activepieces --env <prod or stg>
options: --dry-run for previewing


# Create docker registry creds
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=abuaboud \
  --docker-password=<> \
  --namespace=activepieces
```

### Deploy App and Worker

> **Always pass `--force-conflicts`** when upgrading the app. Argo Rollouts takes server-side apply ownership of `.spec.selector` on the preview Service at runtime; without this flag Helm will fail with a conflict error on subsequent upgrades.

```bash
helm upgrade --install activepieces deploy/activepieces-helm/ \
  -n activepieces \
  -f deploy/staging/stg-app-values.yaml \
  --set image.tag=<>   # ignore if set in values.yaml

helm upgrade --install activepieces-worker deploy/activepieces-helm/ \
  -n activepieces \
  -f deploy/staging/stg-worker-values.yaml \
  --set image.tag=<>
```

### Check Rollout Health

App uses Argo Rollouts (blue-green), workers use StatefulSet.

```bash
# App rollout status
kubectl argo rollouts get rollout activepieces -n activepieces -w

# Worker rollout status
kubectl rollout status statefulset activepieces-worker -n activepieces

# Check pod logs
kubectl logs -n activepieces POD_NAME
```

### Promote App (if healthy)

```bash
kubectl argo rollouts promote activepieces -n activepieces
```

### Scale Worker Pods

Update `replicaCount` in worker values file, then helm upgrade. Or patch directly:

```bash
kubectl scale statefulset activepieces-worker -n activepieces --replicas=x
```

### Install Helm Ingress

```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.nodeSelector."role"=app \
  --set controller.hostNetwork=true \
  --set controller.kind=DaemonSet \
  --set controller.service.enabled=false

# Check app nodes
kubectl get pods -n ingress-nginx -o wide
```

### Certificate

```bash
# Install cert-manager
helm upgrade --install cert-manager cert-manager \
  --repo https://charts.jetstack.io \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: chaker@activepieces.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
EOF
```

### GitHub Secret

Use `cat ~/.kube/config` output for `HETZNER_KUBECONFIG` GitHub secret.

## Operations

### Add Nodes

Edit `worker_node_count` / `app_node_count` in terraform.tfvars, then:

```bash
terraform apply -var-file=<> -target=<hcloud_server.worker_nodes or hcloud_server.app_nodes>
```

### Add Pods

```bash
kubectl scale statefulset activepieces-worker -n activepieces --replicas=32
```

### Update Release

```bash
helm upgrade --install activepieces deploy/activepieces-helm/ \
  -n activepieces \
  -f deploy/staging/stg-app-values.yaml \
  --force-conflicts \
  --set image.tag=<>

helm upgrade --install activepieces-worker deploy/activepieces-helm/ \
  -n activepieces \
  -f deploy/staging/stg-worker-values.yaml \
  --set image.tag=<>
```

After upgrade, pods will be only in preview. We can promote them to be included in traffic after. This is useful to make sure that app pods won't be deployed successfully and workers fail — so only when both succeed we promote them.

### Rollouts

```bash
# Watch app rollout (Argo blue-green)
kubectl argo rollouts get rollout activepieces -n activepieces

# Watch worker rollout (StatefulSet)
kubectl rollout status statefulset activepieces-worker -n activepieces

# Promote app (after preview is healthy)
kubectl argo rollouts promote activepieces -n activepieces

# Rollback app to previous version
kubectl argo rollouts undo activepieces -n activepieces

# Rollback app to specific revision
kubectl argo rollouts undo activepieces -n activepieces --to-revision=14

# Restart workers
kubectl rollout restart statefulset activepieces-worker -n activepieces
```

### Use Multiple Worker Deployments

Use a separate Helm release with its own values file:

```bash
helm upgrade --install activepieces-worker-new deploy/activepieces-helm/ \
  --values deploy/staging/stg-worker-values.yaml \
  --values deploy/staging/stg-worker-heavy-values.yaml \
  -n activepieces
```

### Verify Google IPv4/IPv6 Connectivity

After deploying worker pods, verify they can reach Google APIs over both IPv4 and IPv6. Run curl from inside a pod against the Google secure token endpoint. Both must return HTTP 200 or the node's network is misconfigured.

```bash
# Pick a worker pod
kubectl get pods -n activepieces -l app=activepieces-worker

# IPv4 check
kubectl exec -n activepieces <POD_NAME> -- curl -s -o /dev/null -w "%{http_code}" -4 https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com

# IPv6 check
kubectl exec -n activepieces <POD_NAME> -- curl -s -o /dev/null -w "%{http_code}" -6 https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
```

If either check fails, investigate the node's network configuration before promoting the rollout.

### Add Hostname

In app-values.yaml → ingress → hosts add:

```yaml
- host: "custom.activepieces.dev"
  paths:
    - path: /
      pathType: Prefix
```
