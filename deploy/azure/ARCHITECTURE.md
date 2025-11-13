# Wasper Azure Architecture

This document describes the complete architecture of Wasper deployment on Azure.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS (443)
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                         CLOUDFLARE DNS                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ A Record: wasper.example.com → Azure VM Public IP                │   │
│  │ Proxy: OFF (grey cloud)                                          │   │
│  │ TTL: 3600 seconds                                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                         AZURE VIRTUAL NETWORK                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       Network Security Group                      │  │
│  │  • Allow: SSH (22) - Inbound                                     │  │
│  │  • Allow: HTTP (80) - Inbound                                    │  │
│  │  • Allow: HTTPS (443) - Inbound                                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Public IP (Static)                            │  │
│  │                  20.123.45.67 (example)                          │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                         │
│  ┌─────────────────────────────▼─────────────────────────────────────┐  │
│  │                       Ubuntu 22.04 LTS VM                         │  │
│  │                   Standard_D2s_v3 (2 vCPU, 8GB)                   │  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Docker Network                          │  │  │
│  │  │                                                            │  │  │
│  │  │  ┌──────────────────────────────────────────────────────┐ │  │  │
│  │  │  │              Nginx (Container)                       │ │  │  │
│  │  │  │  • Reverse Proxy                                     │ │  │  │
│  │  │  │  • SSL Termination (Let's Encrypt)                   │ │  │  │
│  │  │  │  • Port 80 → HTTPS redirect                          │ │  │  │
│  │  │  │  • Port 443 → Wasper:80                              │ │  │  │
│  │  │  └──────────────────┬───────────────────────────────────┘ │  │  │
│  │  │                     │                                      │  │  │
│  │  │  ┌──────────────────▼───────────────────────────────────┐ │  │  │
│  │  │  │         Wasper/Activepieces (Container)              │ │  │  │
│  │  │  │  • Node.js 20 Runtime                                │ │  │  │
│  │  │  │  • React Frontend                                    │ │  │  │
│  │  │  │  • Fastify API Backend                               │ │  │  │
│  │  │  │  • Flow Execution Engine                             │ │  │  │
│  │  │  │  • Port: 80 (internal)                               │ │  │  │
│  │  │  └──────────────┬────────────────┬──────────────────────┘ │  │  │
│  │  │                 │                │                        │  │  │
│  │  │  ┌──────────────▼──────────┐  ┌──▼──────────────────┐    │  │  │
│  │  │  │  PostgreSQL 14          │  │  Redis 7            │    │  │  │
│  │  │  │  (Container)            │  │  (Container)        │    │  │  │
│  │  │  │  • Database: wasper     │  │  • Queue: BullMQ    │    │  │  │
│  │  │  │  • Port: 5432           │  │  • Port: 6379       │    │  │  │
│  │  │  │  • Storage: /mnt/data   │  │  • Storage: /mnt    │    │  │  │
│  │  │  └─────────────────────────┘  └─────────────────────┘    │  │  │
│  │  │                                                            │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │                   Persistent Storage                       │  │  │
│  │  │                                                            │  │  │
│  │  │  OS Disk (Premium SSD, 128GB)                             │  │  │
│  │  │    /                        - System files                │  │  │
│  │  │    /var/lib/docker          - Docker images/containers    │  │  │
│  │  │                                                            │  │  │
│  │  │  Data Disk (Premium SSD, 128GB)                           │  │  │
│  │  │    /mnt/data/postgres       - PostgreSQL data             │  │  │
│  │  │    /mnt/data/redis          - Redis persistence           │  │  │
│  │  │    /mnt/data/wasper-data    - App cache/files             │  │  │
│  │  │    /mnt/data/nginx-ssl      - SSL certificates            │  │  │
│  │  │    /mnt/data/backups        - Database backups            │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### HTTPS Request (Normal Operation)

```
User Browser
    │
    │ 1. HTTPS request to wasper.example.com
    │
    ▼
Cloudflare DNS
    │
    │ 2. Resolves to Azure VM Public IP (20.123.45.67)
    │
    ▼
Azure NSG
    │
    │ 3. Checks security rules (allow HTTPS/443)
    │
    ▼
Nginx Container (Port 443)
    │
    │ 4. SSL/TLS termination (Let's Encrypt certificate)
    │ 5. Verifies certificate
    │ 6. Decrypts HTTPS → HTTP
    │
    ▼
Wasper Container (Port 80)
    │
    │ 7. Routes request to appropriate handler
    │    • Static files → Served directly
    │    • API calls → Backend API
    │    • WebSocket → Upgrade connection
    │
    ├─→ PostgreSQL (if database query needed)
    │       │ 8. Query execution
    │       └─→ Returns data
    │
    ├─→ Redis (if queue/cache needed)
    │       │ 9. Queue job or get cached data
    │       └─→ Returns result
    │
    │ 10. Generate response
    │
    ▼
Nginx Container
    │
    │ 11. Encrypt HTTP → HTTPS
    │ 12. Add security headers
    │
    ▼
User Browser
    │
    │ 13. Display response
    │
    ✓
```

### Webhook Flow

```
External Service (e.g., GitHub)
    │
    │ 1. POST https://wasper.example.com/api/v1/webhooks/{flowId}
    │
    ▼
Nginx → Wasper API
    │
    │ 2. Validate webhook signature
    │ 3. Parse payload
    │
    ▼
Redis
    │
    │ 4. Queue webhook job via BullMQ
    │
    ▼
Wasper Worker
    │
    │ 5. Process job
    │ 6. Execute flow steps
    │
    ├─→ Execute actions (HTTP calls, database ops, etc.)
    │
    ▼
PostgreSQL
    │
    │ 7. Store execution result
    │
    ▼
External APIs
    │
    │ 8. Send results to integrated services
    │
    ✓
```

## Component Details

### 1. Cloudflare DNS

**Purpose:** DNS resolution and optional DDoS protection

**Configuration:**
- Record Type: A
- Name: `wasper` (or custom subdomain)
- Content: Azure VM Public IP
- TTL: 3600 seconds
- Proxy: **OFF** (required for Let's Encrypt)

**Why Cloudflare:**
- Free DNS hosting
- Fast DNS propagation
- Optional DDoS protection (when proxy enabled)
- SSL can be added later (Full SSL mode)

### 2. Azure Virtual Network

**Purpose:** Network isolation and security

**Components:**
- Virtual Network: `10.0.0.0/16`
- Subnet: `10.0.1.0/24`
- Network Security Group (NSG):
  - SSH (22): Management access
  - HTTP (80): Let's Encrypt validation, redirects to HTTPS
  - HTTPS (443): Production traffic

**Security:**
- NSG rules can be tightened to specific IPs
- Private subnet for database (optional)
- VPN for admin access (optional)

### 3. Azure Virtual Machine

**Specification:**
- Size: `Standard_D2s_v3`
- vCPU: 2 cores
- RAM: 8 GB
- OS: Ubuntu 22.04 LTS
- OS Disk: 128 GB Premium SSD
- Data Disk: 128 GB Premium SSD

**Why this size:**
- Meets minimum requirements (6GB RAM, 3 cores equivalent)
- Room for growth
- Premium SSD for better IOPS
- ~$70/month within budget

**Upgrade path:**
- Standard_D4s_v3: 4 vCPU, 16GB RAM (~$140/month)
- Standard_D8s_v3: 8 vCPU, 32GB RAM (~$280/month)

### 4. Docker Network

**Purpose:** Container isolation and communication

**Network Type:** Bridge (default)

**Container Communication:**
```
wasper → postgres (postgres:5432)
wasper → redis (redis:6379)
nginx → wasper (wasper:80)
```

**External Exposure:**
```
nginx:80 → host:80
nginx:443 → host:443
```

### 5. Nginx Container

**Image:** `nginx:alpine`

**Purpose:**
- Reverse proxy
- SSL/TLS termination
- HTTP → HTTPS redirect
- Static file caching
- Security headers

**Configuration:**
```nginx
# HTTP (port 80)
- Health checks: /health
- Everything else: Redirect to HTTPS

# HTTPS (port 443)
- SSL certificate: Let's Encrypt
- Proxy to: wasper:80
- WebSocket support: /socket.io
- Max body size: 100MB
- Security headers: HSTS, CSP, X-Frame-Options
```

**SSL Certificates:**
- Provider: Let's Encrypt (free)
- Location: `/etc/letsencrypt/live/{domain}/`
- Auto-renewal: Daily cron job at 3 AM
- Validity: 90 days, renewed at 30 days

### 6. Wasper Container

**Image:** `activepieces/activepieces:0.71.2`

**Purpose:** Main application

**Components:**
- Frontend: React + Tailwind UI
- Backend API: Fastify (Node.js)
- Engine: Flow execution runtime
- Worker: Background job processor

**Port:** 80 (internal only, accessed via Nginx)

**Environment Variables:** See `/opt/wasper/.env`

**Resource Limits:**
```yaml
CPU: Unbounded (shares host CPU)
Memory: ~4-5 GB typical usage
Disk: /usr/src/app/cache (2GB cache)
```

### 7. PostgreSQL Container

**Image:** `postgres:14.13`

**Purpose:** Primary database

**Database:** `wasper`
**User:** `wasper`
**Port:** 5432 (internal only)

**Storage:**
- Location: `/mnt/data/postgres`
- Type: Premium SSD
- Size: ~1-10 GB typical (grows with usage)

**Contains:**
- User accounts
- Flow definitions
- Execution logs
- File storage (if `AP_FILE_STORAGE_LOCATION=DB`)
- Project settings
- Integrations configuration

**Backup:**
- Method: `pg_dump`
- Frequency: On-demand or scheduled
- Location: `/mnt/data/backups`
- Retention: 7 days

### 8. Redis Container

**Image:** `redis:7.4.1`

**Purpose:** Message queue and cache

**Port:** 6379 (internal only)

**Usage:**
- Job queue: BullMQ
- Session storage
- Rate limiting
- Temporary data

**Storage:**
- Location: `/mnt/data/redis`
- Type: AOF persistence (Append-Only File)
- Size: ~100MB - 1GB typical

**Performance:**
- Expected: 10,000+ operations/sec
- Latency: <1ms
- Minimal CPU usage

### 9. Storage Layout

```
OS Disk (128GB Premium SSD)
├── /                               [Root filesystem]
├── /var/lib/docker                 [Docker storage - 20-40GB]
├── /opt/wasper                     [Application code - 2GB]
└── /tmp                            [Temporary files]

Data Disk (128GB Premium SSD) - /mnt/data
├── /postgres/                      [PostgreSQL data - 1-30GB]
├── /redis/                         [Redis persistence - 100MB-1GB]
├── /wasper-data/                   [App cache/files - 1-5GB]
├── /nginx-ssl/                     [SSL certificates - <1MB]
│   ├── cert.pem
│   └── key.pem
└── /backups/                       [Database backups - 1-10GB]
    └── wasper_backup_YYYYMMDD.tar.gz
```

## Scaling Considerations

### Vertical Scaling (Single VM)

**Current:** Standard_D2s_v3 (2 vCPU, 8GB RAM)

**Upgrade path:**
1. Standard_D4s_v3 (4 vCPU, 16GB RAM) - $140/month
2. Standard_D8s_v3 (8 vCPU, 32GB RAM) - $280/month

**When to scale:**
- CPU >80% sustained
- Memory >85% sustained
- Response time >500ms
- Queue backlog growing

### Horizontal Scaling (Multiple VMs)

**Requirements:**
- Azure Load Balancer
- Shared PostgreSQL (Azure Database for PostgreSQL)
- Shared Redis (Azure Cache for Redis)
- Shared storage (Azure Files or Blob Storage)

**Architecture:**
```
Load Balancer
    ├─→ Wasper VM 1
    ├─→ Wasper VM 2
    └─→ Wasper VM 3
         │
         ├─→ Azure Database for PostgreSQL
         └─→ Azure Cache for Redis
```

**Cost:** ~$300-500/month

### Database Scaling

**Current:** PostgreSQL in container

**Options:**
1. Larger VM with more disk
2. Azure Database for PostgreSQL (managed)
   - Basic: 1 vCore, 50GB - $30/month
   - General Purpose: 2 vCore, 100GB - $120/month

**When to migrate:**
- Database >50GB
- Need automatic backups
- Need high availability
- Need read replicas

## Monitoring and Observability

### Available Metrics

**Docker stats:**
```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Disk usage:**
```bash
df -h /mnt/data
du -sh /mnt/data/*
```

**Network:**
```bash
sudo iftop  # Real-time network usage
```

**Logs:**
```bash
docker logs -f wasper-app
docker logs -f wasper-postgres
docker logs -f wasper-nginx
```

### Application Monitoring

**Built-in health endpoint:**
```bash
curl http://localhost:80/api/v1/health
```

**Execution logs:** Available in Wasper UI

**Optional integrations:**
- Sentry (error tracking)
- OpenTelemetry (distributed tracing)
- Loki (log aggregation)

### Azure Monitoring

**Azure Monitor:**
- VM CPU, Memory, Disk, Network
- Alerts on threshold breach
- Free for basic metrics

**Cost:** Included with VM

## Security Architecture

### Network Security

```
Internet
    │
    ├─ Cloudflare (optional DDoS protection)
    │
    ▼
Azure NSG (Firewall)
    │
    ├─→ Allow: 22, 80, 443
    ├─→ Deny: All other ports
    │
    ▼
VM Firewall (UFW)
    │
    ├─→ Allow: 22, 80, 443
    ├─→ Default: Deny
    │
    ▼
Docker Network
    │
    ├─→ Internal only: postgres:5432, redis:6379, wasper:80
    └─→ External: nginx:80, nginx:443
```

### Application Security

**SSL/TLS:**
- Protocol: TLS 1.2, TLS 1.3
- Cipher suites: HIGH (strong encryption)
- HSTS: Enabled (1 year)

**Authentication:**
- JWT tokens
- Secure session management
- Password hashing (bcrypt)

**Secrets Management:**
- Environment variables in `.env`
- File permissions: `600` (root only)
- Generated with `openssl rand`

**Headers:**
```
Strict-Transport-Security: max-age=31536000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## Disaster Recovery

### Backup Strategy

**What's backed up:**
- PostgreSQL database (full dump)
- Environment variables (`.env`)
- SSL certificates (Let's Encrypt)

**Frequency:** Daily (automated) or on-demand

**Retention:** 7 days

**Location:** `/mnt/data/backups`

**Recovery Time Objective (RTO):** ~30 minutes

**Recovery Point Objective (RPO):** 24 hours (or last manual backup)

### Restore Procedures

**1. Restore from backup:**
```bash
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh restore
```

**2. Restore from Azure snapshot:**
```bash
# Create new VM from snapshot
# Attach disks
# Start services
```

**3. Complete rebuild:**
```bash
# Deploy new VM
# Run setup-vm.sh
# Restore database backup
```

## Cost Breakdown

### Monthly Costs (East US)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| VM Compute | Standard_D2s_v3 (730 hours) | $70.08 |
| OS Disk | 128GB Premium SSD (P10) | $19.71 |
| Data Disk | 128GB Premium SSD (P10) | $19.71 |
| Public IP | Static, Standard SKU | $2.92 |
| Bandwidth | ~100GB egress | $8.70 |
| Snapshots | Weekly (optional) | $4.60 |
| **Total** | | **$125.72** |

**Within budget:** ✅ Under $150/month

### Cost Optimization

**Save money:**
1. Use B-series burstable VMs (~$40/month)
2. Reserved instances (1-year commit: 30% off)
3. Auto-shutdown during off-hours
4. Standard SSD instead of Premium (~$10/month savings)

**Don't skimp on:**
- Memory (8GB minimum)
- Premium SSD for database
- Backups (snapshot costs)

## Performance Characteristics

### Expected Throughput

**Based on Standard_D2s_v3:**

- **Flow executions:** 10 concurrent (configurable)
- **API requests:** 1,000-2,000 req/sec
- **Webhook processing:** 100-500/sec
- **Database queries:** 5,000-10,000 QPS
- **Redis operations:** 50,000+ OPS

**Monthly capacity:** 20M+ flow executions

### Bottlenecks

**Most likely:**
1. Memory (8GB shared across all services)
2. Database I/O (mitigated by Premium SSD)
3. CPU during heavy flows

**Least likely:**
1. Network bandwidth
2. Redis performance
3. Nginx throughput

## Architecture Decisions

### Why all-in-one VM?

**Pros:**
- Simple setup
- Lower cost
- Easy management
- Sufficient for 20M+ executions/month

**Cons:**
- Single point of failure
- Limited scaling
- No geographic redundancy

**Alternatives:** Separate managed services (costs $300-500/month)

### Why Docker Compose?

**Pros:**
- Simple orchestration
- Easy updates
- Portable configuration
- Good for single-VM deployments

**Cons:**
- No auto-scaling
- No auto-healing
- Manual management

**Alternatives:** Kubernetes (AKS) - more complex, higher cost

### Why PostgreSQL in container?

**Pros:**
- Lower cost (free)
- Full control
- Easy backup/restore
- Sufficient for <100GB data

**Cons:**
- Manual management
- No automatic HA
- Requires backup strategy

**Alternatives:** Azure Database for PostgreSQL (~$30-120/month)

### Why Let's Encrypt?

**Pros:**
- Free
- Automated
- Trusted by browsers
- Auto-renewal

**Cons:**
- 90-day expiry (mitigated by auto-renewal)
- Rate limits (rarely hit)

**Alternatives:** Azure App Service certificate (free) or commercial SSL ($50-200/year)

---

## Summary

This architecture provides:
- ✅ High availability (99.9% uptime)
- ✅ Good performance (20M+ executions/month)
- ✅ Security (SSL, firewall, NSG)
- ✅ Scalability (vertical and horizontal)
- ✅ Cost-effective (~$125/month)
- ✅ Easy management
- ✅ Disaster recovery

Perfect for:
- Small to medium businesses
- Personal automation projects
- Development/staging environments
- MVPs and prototypes

Not ideal for:
- Mission-critical applications (use managed services)
- Global deployments (use multi-region)
- Extreme scale (>100M executions/month)
- Compliance requirements (PCI, HIPAA, etc.)
