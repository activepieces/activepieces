# Activepieces Helm Chart

This Helm chart deploys Activepieces with PostgreSQL and Redis dependencies.

## Prerequisites

- Kubernetes 1.16+
- Helm 3.0+

## Installing the Chart

First, add the Bitnami repository for PostgreSQL and Redis dependencies:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

Update the chart dependencies:

```bash
helm dependency update deploy/activepieces-helm
```

Install the chart with the release name `my-activepieces`:

```bash
helm install my-activepieces deploy/activepieces-helm
```

## Configuration

The following table lists the configurable parameters and their default values.

### Activepieces Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `activepieces.frontendUrl` | Frontend URL where Activepieces will be accessible | `"http://localhost:8080"` |
| `activepieces.encryptionKey` | Encryption key for connections (32-char hex) | `""` (auto-generated) |
| `activepieces.jwtSecret` | JWT secret for generating tokens (64-char hex) | `""` (auto-generated) |
| `activepieces.executionMode` | Execution mode | `"UNSANDBOXED"` |
| `activepieces.environment` | Environment | `"prod"` |
| `activepieces.telemetryEnabled` | Enable telemetry | `true` |

### PostgreSQL Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.auth.database` | Database name | `"activepieces"` |
| `postgresql.auth.username` | Database username | `"activepieces"` |
| `postgresql.auth.password` | Database password | `"activepieces"` |

### Redis Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Enable Redis | `true` |
| `redis.auth.enabled` | Enable Redis authentication | `false` |

## Generating Secrets

Generate encryption key and JWT secret:

```bash
# Encryption key (32 characters)
openssl rand -hex 16

# JWT secret (64 characters) 
openssl rand -hex 32

# PostgreSQL password
openssl rand -hex 32
```

## Accessing Activepieces

After installation, you can access Activepieces by:

1. **Port forwarding** (for testing):
```bash
kubectl port-forward svc/my-activepieces 8080:80
```
Then visit http://localhost:8080

2. **Ingress** (for production):
Configure the ingress section in values.yaml with your domain.

3. **LoadBalancer** (cloud environments):
```bash
kubectl get svc my-activepieces
```

## Uninstalling the Chart

```bash
helm uninstall my-activepieces
```

## Troubleshooting

### Check pod status
```bash
kubectl get pods
kubectl logs <pod-name>
```

### Check PostgreSQL connection
```bash
kubectl exec -it <activepieces-pod> -- env | grep POSTGRES
```

### Check Redis connection
```bash
kubectl exec -it <activepieces-pod> -- env | grep REDIS
``` 