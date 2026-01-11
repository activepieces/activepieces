# ActivePieces Split Architecture Deployment Guide

## Overview

Based on your benchmark results showing **181% CPU average** (1.8 cores) and **30% memory** (2.3GB), this guide shows how to deploy ActivePieces in a cost-optimized split architecture.

## Architecture

```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
         ├──────────► ┌──────────────────┐
         │            │  APP Container   │  (Handles UI, API, Webhooks)
         │            │  CPU: 0.5 vCPU   │
         │            │  RAM: 1 GB       │
         │            │  Replicas: 1     │
         │            └─────────┬────────┘
         │                      │
         │                      ├─► PostgreSQL (db.t4g.micro)
         │                      └─► Redis (cache.t4g.micro)
         │                           ▲
         └─────────────────────────► │
                                     │
                          ┌──────────┴──────────┐
                          │  WORKER Containers  │  (Process flows)
                          │  CPU: 2 vCPU        │
                          │  RAM: 4 GB          │
                          │  Replicas: 1-3      │  (Auto-scales)
                          └─────────────────────┘
```

## Why This Architecture?

From your benchmark:
- **APP container**: Receives ~200 webhooks/sec, routes to queue (~0.3 cores needed)
- **WORKER containers**: Process flows (1.8-2.5 cores needed for 25 concurrent workers)
- **PostgreSQL**: Only 27% CPU average (~0.3 cores)
- **Redis**: Only 12% CPU average (~0.1 cores)

This split allows:
✅ Independent scaling of the bottleneck (workers)
✅ Cost savings (small APP, scale workers as needed)
✅ Better reliability (APP stays responsive during high load)

---

## Deployment Option 1: AWS ECS Fargate (Recommended)

### Prerequisites
- AWS CLI configured
- Docker installed
- ActivePieces image pushed to ECR

### Cost Estimate
| Component | Resource | Monthly Cost |
|-----------|----------|--------------|
| APP | 0.5 vCPU, 1GB (Fargate) | ~$15 |
| WORKER (base) | 2 vCPU, 4GB (Fargate) | ~$30 |
| WORKER (auto-scale) | +1 task during peaks | ~$5 |
| PostgreSQL | db.t4g.micro (2 vCPU, 1GB) | ~$12 |
| Redis | cache.t4g.micro (2 vCPU, 0.5GB) | ~$11 |
| Load Balancer | Application Load Balancer | ~$16 |
| **Total (baseline)** | | **~$89/month** |
| **Total (with scaling)** | | **~$94/month** |

### Step 1: Create ECS Task Definitions

#### APP Task Definition (`activepieces-app-task.json`)

```json
{
  "family": "activepieces-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "activepieces-app",
      "image": "YOUR_ECR_REPO/activepieces:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AP_CONTAINER_TYPE",
          "value": "APP"
        },
        {
          "name": "AP_FLOW_WORKER_CONCURRENCY",
          "value": "0"
        },
        {
          "name": "AP_EXECUTION_MODE",
          "value": "SANDBOX_CODE_ONLY"
        },
        {
          "name": "AP_FRONTEND_URL",
          "value": "https://your-domain.com"
        },
        {
          "name": "AP_POSTGRES_HOST",
          "value": "your-rds-endpoint.rds.amazonaws.com"
        },
        {
          "name": "AP_REDIS_HOST",
          "value": "your-elasticache-endpoint.cache.amazonaws.com"
        }
      ],
      "secrets": [
        {
          "name": "AP_ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/encryption-key"
        },
        {
          "name": "AP_JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/jwt-secret"
        },
        {
          "name": "AP_POSTGRES_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/activepieces-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### WORKER Task Definition (`activepieces-worker-task.json`)

```json
{
  "family": "activepieces-worker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "activepieces-worker",
      "image": "YOUR_ECR_REPO/activepieces:latest",
      "essential": true,
      "environment": [
        {
          "name": "AP_CONTAINER_TYPE",
          "value": "WORKER"
        },
        {
          "name": "AP_FLOW_WORKER_CONCURRENCY",
          "value": "25"
        },
        {
          "name": "AP_EXECUTION_MODE",
          "value": "SANDBOX_CODE_ONLY"
        },
        {
          "name": "AP_FRONTEND_URL",
          "value": "https://your-domain.com"
        },
        {
          "name": "AP_POSTGRES_HOST",
          "value": "your-rds-endpoint.rds.amazonaws.com"
        },
        {
          "name": "AP_REDIS_HOST",
          "value": "your-elasticache-endpoint.cache.amazonaws.com"
        }
      ],
      "secrets": [
        {
          "name": "AP_ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/encryption-key"
        },
        {
          "name": "AP_JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/jwt-secret"
        },
        {
          "name": "AP_POSTGRES_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:activepieces/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/activepieces-worker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 2: Create ECS Services

#### Create APP Service
```bash
aws ecs create-service \
  --cluster activepieces-cluster \
  --service-name activepieces-app \
  --task-definition activepieces-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/activepieces-app,containerName=activepieces-app,containerPort=80"
```

#### Create WORKER Service with Auto-scaling
```bash
# Create service
aws ecs create-service \
  --cluster activepieces-cluster \
  --service-name activepieces-worker \
  --task-definition activepieces-worker \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"

# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/activepieces-cluster/activepieces-worker \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 5

# Create scaling policy (scale based on CPU)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/activepieces-cluster/activepieces-worker \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

### Step 3: Advanced Scaling - Queue-Based (Better for Workflows)

Instead of CPU-based scaling, scale based on Redis queue depth:

```bash
# Create custom CloudWatch metric for queue length
# (You'll need to publish this from your app)

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/activepieces-cluster/activepieces-worker \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name queue-depth-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 50.0,
    "CustomizedMetricSpecification": {
      "MetricName": "ApproximateNumberOfMessagesVisible",
      "Namespace": "ActivePieces/Queue",
      "Dimensions": [
        {
          "Name": "QueueName",
          "Value": "activepieces-flows"
        }
      ],
      "Statistic": "Average"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## Deployment Option 2: Kubernetes with KEDA

### Prerequisites
- Kubernetes cluster (EKS, GKE, or AKS)
- Helm installed
- KEDA installed

### Cost Estimate (AWS EKS)
| Component | Resource | Monthly Cost |
|-----------|----------|--------------|
| EKS Control Plane | - | $73 |
| APP Node | t4g.small (2 vCPU, 2GB) | ~$13 |
| WORKER Nodes | t4g.medium (2 vCPU, 4GB) × 1-3 | ~$27-81 |
| PostgreSQL | db.t4g.micro | ~$12 |
| Redis | cache.t4g.micro | ~$11 |
| **Total (baseline)** | | **~$136/month** |
| **Total (with scaling)** | | **~$190/month** |

⚠️ **Note**: EKS has a $73/month control plane cost, making it more expensive than ECS for small deployments.

### Helm Values (`values-split.yaml`)

```yaml
# APP Deployment
app:
  enabled: true
  replicaCount: 1

  image:
    repository: your-registry/activepieces
    tag: latest

  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi

  env:
    - name: AP_CONTAINER_TYPE
      value: "APP"
    - name: AP_FLOW_WORKER_CONCURRENCY
      value: "0"
    - name: AP_EXECUTION_MODE
      value: "SANDBOX_CODE_ONLY"

  service:
    type: LoadBalancer
    port: 80

# WORKER Deployment
worker:
  enabled: true
  replicaCount: 1

  image:
    repository: your-registry/activepieces
    tag: latest

  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi

  env:
    - name: AP_CONTAINER_TYPE
      value: "WORKER"
    - name: AP_FLOW_WORKER_CONCURRENCY
      value: "25"
    - name: AP_EXECUTION_MODE
      value: "SANDBOX_CODE_ONLY"

  # KEDA Auto-scaling (Queue-based)
  autoscaling:
    enabled: true
    minReplicaCount: 1
    maxReplicaCount: 5
    pollingInterval: 30
    cooldownPeriod: 300

    triggers:
      - type: redis
        metadata:
          address: redis-service:6379
          listName: bull:activepieces:wait
          listLength: "50"
          databaseIndex: "0"

# Shared Database
postgresql:
  enabled: true
  primary:
    resources:
      requests:
        cpu: 250m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 512Mi

# Shared Cache
redis:
  enabled: true
  master:
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 250m
        memory: 256Mi
```

### Deploy with Helm

```bash
# Install KEDA (if not already installed)
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace

# Deploy ActivePieces with split architecture
helm install activepieces ./activepieces-helm \
  -f values-split.yaml \
  --namespace activepieces \
  --create-namespace
```

---

## Testing Locally with Docker Compose

### Test the split architecture locally first:

```bash
# Use the split docker-compose file
docker compose -f docker-compose-split.yml up -d

# Check that both containers are running
docker compose -f docker-compose-split.yml ps

# Check logs
docker compose -f docker-compose-split.yml logs -f activepieces-app
docker compose -f docker-compose-split.yml logs -f activepieces-worker

# Test scaling workers
docker compose -f docker-compose-split.yml up -d --scale activepieces-worker=3

# Run benchmark
./benchmark-with-monitoring.sh http://localhost:8080/api/v1/webhooks/YOUR_ID/sync
```

---

## Monitoring & Metrics

### Key Metrics to Monitor

**For APP Container:**
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- CPU usage (should be <50%)
- Memory usage

**For WORKER Containers:**
- Queue depth (jobs waiting in Redis)
- Job processing rate (jobs/sec)
- Job success/failure rate
- CPU usage (target 70% for auto-scaling)
- Memory usage
- Worker concurrency utilization

**For Database:**
- Connection pool utilization
- Query latency
- Active connections

**For Redis:**
- Queue length
- Memory usage
- Evicted keys

### CloudWatch Dashboard (AWS)

```bash
# Create custom metrics for queue monitoring
aws cloudwatch put-metric-data \
  --namespace ActivePieces/Queue \
  --metric-name QueueDepth \
  --value 42 \
  --dimensions QueueName=flows
```

---

## Optimization Tips

### 1. Right-size Worker Concurrency

Your benchmark showed 25 workers used 2.5 cores:
- **0.1 core per worker**
- For a 2 vCPU worker: Set `AP_FLOW_WORKER_CONCURRENCY=20`
- For a 4 vCPU worker: Set `AP_FLOW_WORKER_CONCURRENCY=40`

### 2. Use Spot Instances for Workers (AWS)

Workers are stateless and can be interrupted:

```bash
aws ecs create-service \
  --capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=100,base=0
```

This can save **70% on worker costs**.

### 3. Connection Pooling

Set PostgreSQL connection pool size per container:

```env
# APP: Needs fewer connections
AP_POSTGRES_POOL_SIZE=10

# WORKER: Needs more connections
AP_POSTGRES_POOL_SIZE=25
```

### 4. Redis Persistence

Workers use Redis as a queue. Consider:
- **ElastiCache with replication** for production
- **AOF persistence** to prevent job loss on restart

---

## Migration Path

### From Monolithic to Split:

1. **Test locally** with `docker-compose-split.yml`
2. **Deploy APP first** (keeps existing monolithic as backup)
3. **Deploy WORKER** (both will process jobs initially)
4. **Switch traffic** to new APP
5. **Scale down monolithic** to 0 workers
6. **Decommission monolithic** once stable

### Rollback Plan:

Keep your original `docker-compose.yml`:
```bash
# Rollback
docker compose -f docker-compose.yml up -d
```

---

## Cost Comparison

| Architecture | AWS (Monthly) | Azure (Monthly) |
|-------------|---------------|-----------------|
| **Monolithic** (Your current: t3.xlarge) | ~$120 | ~$140 |
| **Split (ECS Fargate)** | **~$89** | N/A |
| **Split (Kubernetes)** | ~$136 | ~$180 |

**Savings with ECS Fargate: ~$31/month (26% cheaper)**

---

## Conclusion

Your plan is **excellent and fully supported** by ActivePieces!

### Recommended Approach:
1. ✅ **Test locally** with `docker-compose-split.yml` (I created this for you)
2. ✅ **Deploy to AWS ECS Fargate** (most cost-effective at your scale)
3. ✅ **Use CPU-based auto-scaling** initially, then optimize to queue-based
4. ✅ **Monitor and adjust** worker concurrency based on actual load

Your benchmark proved you need **~2 cores for 200 req/sec**. With this split architecture, you can:
- Start at **$89/month** (vs $147 your original estimate)
- Auto-scale to handle **5x your current load**
- Only pay for extra workers during peaks

**Next step:** Want me to help you test the split architecture locally first?
