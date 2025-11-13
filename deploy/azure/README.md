# Wasper Azure Deployment Guide

Complete guide for deploying Wasper (Activepieces fork) on Azure with SSL and custom domain.

## Table of Contents

- [Overview](#overview)
- [Cost Estimate](#cost-estimate)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Option 1: Automated Terraform Deployment](#option-1-automated-terraform-deployment)
- [Option 2: Manual VM Setup](#option-2-manual-vm-setup)
- [DNS Configuration with Cloudflare](#dns-configuration-with-cloudflare)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Management Commands](#management-commands)
- [Troubleshooting](#troubleshooting)
- [Backup and Restore](#backup-and-restore)
- [Upgrading](#upgrading)

---

## Overview

This deployment sets up Wasper on Azure with:

- ✅ **Ubuntu 22.04 LTS VM** (Standard_D2s_v3 - 2 vCPU, 8GB RAM)
- ✅ **Docker Compose** orchestration
- ✅ **PostgreSQL 14** database
- ✅ **Redis 7** message queue
- ✅ **Nginx** reverse proxy with SSL
- ✅ **Let's Encrypt** free SSL certificates
- ✅ **Automatic SSL renewal**
- ✅ **Cloudflare DNS** integration
- ✅ **Backup/restore** scripts
- ✅ **Under $150/month** budget

**Architecture:**
```
Internet → Cloudflare DNS → Azure Public IP → Nginx (443) → Wasper (80) → PostgreSQL + Redis
```

---

## Cost Estimate

| Resource | Specification | Monthly Cost |
|----------|--------------|--------------|
| VM | Standard_D2s_v3 (2 vCPU, 8GB RAM) | ~$70 |
| OS Disk | 128GB Premium SSD | ~$20 |
| Data Disk | 128GB Premium SSD | ~$20 |
| Public IP | Static | ~$3 |
| Bandwidth | ~100GB | ~$5-10 |
| **Total** | | **~$118-123** |

**Upgrade Option:** Standard_D4s_v3 (4 vCPU, 16GB RAM) - ~$140/month total

---

## Prerequisites

### 1. Azure Account
- Active Azure subscription
- Azure CLI installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
- Terraform installed: https://www.terraform.io/downloads

### 2. Domain & DNS
- A domain name (e.g., `example.com`)
- Cloudflare account with domain configured
- Cloudflare API token (for automated DNS setup)

### 3. SSH Key
```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/wasper_azure
```

### 4. Local Tools
```bash
# Ubuntu/Debian
sudo apt-get install -y git curl jq dig

# macOS
brew install git curl jq bind
```

---

## Deployment Options

### Option 1: Automated Terraform Deployment

**Best for:** Production deployments, infrastructure as code

#### Step 1: Configure Terraform

```bash
cd deploy/azure/terraform

# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration
nano terraform.tfvars
```

Update `terraform.tfvars`:
```hcl
location            = "eastus"
resource_group_name = "wasper-rg"
environment         = "prod"
vm_size            = "Standard_D2s_v3"
admin_username     = "wasperadmin"
ssh_public_key_path = "~/.ssh/wasper_azure.pub"
domain_name        = "wasper.yourdomain.com"  # CHANGE THIS!
```

#### Step 2: Deploy Infrastructure

```bash
# Login to Azure
az login

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (takes 5-10 minutes)
terraform apply
```

#### Step 3: Get VM IP Address

```bash
# Get outputs
terraform output

# Save the public IP
export VM_IP=$(terraform output -raw public_ip_address)
export SSH_CMD=$(terraform output -raw ssh_connection_string)

echo "VM IP: $VM_IP"
echo "SSH: $SSH_CMD"
```

#### Step 4: Connect and Complete Setup

```bash
# SSH into VM
$SSH_CMD

# OR
ssh wasperadmin@$VM_IP

# Once connected, run setup script
cd /opt/wasper/deploy/azure/scripts
sudo ./setup-vm.sh wasper.yourdomain.com
```

**Continue to [DNS Configuration](#dns-configuration-with-cloudflare)**

---

### Option 2: Manual VM Setup

**Best for:** Learning, testing, or existing Azure VM

#### Step 1: Create Azure VM Manually

1. **Go to Azure Portal:** https://portal.azure.com
2. **Create VM:**
   - Resource Group: `wasper-rg` (create new)
   - VM Name: `wasper-vm`
   - Region: `East US` (or your preferred region)
   - Image: `Ubuntu 22.04 LTS Gen2`
   - Size: `Standard_D2s_v3` (2 vCPU, 8GB RAM)
   - Authentication: SSH public key
   - Username: `wasperadmin`
   - SSH Key: Paste your public key
   - Public IP: Static
   - Inbound ports: 22, 80, 443

3. **Add Data Disk:**
   - Disks tab → Add new disk
   - Size: 128GB
   - Type: Premium SSD

4. **Review + Create**

5. **Note the Public IP** (e.g., `20.123.45.67`)

#### Step 2: SSH into VM

```bash
ssh wasperadmin@YOUR_VM_IP
```

#### Step 3: Download Setup Script

```bash
# Install git
sudo apt-get update
sudo apt-get install -y git

# Clone Wasper repository
cd /opt
sudo git clone https://github.com/mjaftueshem/wasper.git
sudo chown -R $USER:$USER /opt/wasper
```

#### Step 4: Run Setup Script

```bash
cd /opt/wasper/deploy/azure/scripts
sudo ./setup-vm.sh wasper.yourdomain.com
```

The script will:
- ✅ Install Docker and dependencies
- ✅ Configure firewall
- ✅ Mount and format data disk
- ✅ Generate secure environment variables
- ✅ Create Docker Compose configuration
- ✅ Setup Nginx with temporary SSL
- ✅ Start all services
- ✅ Create systemd service

**Continue to [DNS Configuration](#dns-configuration-with-cloudflare)**

---

## DNS Configuration with Cloudflare

### Method 1: Automated (Recommended)

```bash
# On your local machine (not the VM)
cd deploy/azure/cloudflare

./setup-dns.sh wasper yourdomain.com YOUR_CLOUDFLARE_API_TOKEN
```

**Get Cloudflare API Token:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit zone DNS" template
4. Select your domain zone
5. Copy the token

### Method 2: Manual Configuration

1. **Login to Cloudflare:** https://dash.cloudflare.com
2. **Select your domain**
3. **Go to DNS → Records**
4. **Add A Record:**
   - Type: `A`
   - Name: `wasper` (or your subdomain)
   - IPv4 address: `YOUR_VM_PUBLIC_IP`
   - Proxy status: **DNS only** (grey cloud, not orange!)
   - TTL: `Auto` or `3600`
5. **Save**

### Verification

Wait 5-30 minutes for DNS propagation, then verify:

```bash
# Check DNS resolution
dig +short wasper.yourdomain.com

# Should return your VM IP
# 20.123.45.67
```

---

## SSL Certificate Setup

After DNS is configured and verified, setup SSL:

```bash
# SSH into your VM
ssh wasperadmin@YOUR_VM_IP

# Run SSL setup script
sudo /opt/wasper/deploy/azure/scripts/setup-ssl.sh wasper.yourdomain.com your-email@example.com
```

The script will:
- ✅ Install Certbot
- ✅ Verify DNS configuration
- ✅ Obtain Let's Encrypt certificate
- ✅ Configure Nginx with SSL
- ✅ Setup automatic renewal (daily at 3 AM)
- ✅ Test SSL configuration

**Access Wasper:** https://wasper.yourdomain.com

---

## Management Commands

### Using Management Script

```bash
cd /opt/wasper/deploy/azure/scripts
sudo ./manage-wasper.sh <command>
```

**Available commands:**

```bash
# Service Management
sudo ./manage-wasper.sh start       # Start Wasper
sudo ./manage-wasper.sh stop        # Stop Wasper
sudo ./manage-wasper.sh restart     # Restart Wasper
sudo ./manage-wasper.sh status      # Show status

# Monitoring
sudo ./manage-wasper.sh logs        # View all logs
sudo ./manage-wasper.sh logs wasper # View specific service logs
sudo ./manage-wasper.sh health      # Check health
sudo ./manage-wasper.sh stats       # Resource usage

# Maintenance
sudo ./manage-wasper.sh update      # Update Wasper
sudo ./manage-wasper.sh backup      # Backup database
sudo ./manage-wasper.sh restore     # Restore from backup
sudo ./manage-wasper.sh clean       # Clean up old images
```

### Using Systemd

```bash
sudo systemctl start wasper    # Start
sudo systemctl stop wasper     # Stop
sudo systemctl restart wasper  # Restart
sudo systemctl status wasper   # Status
```

### Direct Docker Compose

```bash
cd /opt/wasper

# View all services
docker compose -f docker-compose.azure.yml ps

# View logs
docker compose -f docker-compose.azure.yml logs -f

# Restart specific service
docker compose -f docker-compose.azure.yml restart wasper

# Stop all services
docker compose -f docker-compose.azure.yml down

# Start all services
docker compose -f docker-compose.azure.yml up -d
```

---

## Troubleshooting

### Services won't start

```bash
# Check Docker status
sudo systemctl status docker

# Check service logs
docker compose -f /opt/wasper/docker-compose.azure.yml logs

# Check specific service
docker logs wasper-app
docker logs wasper-postgres
docker logs wasper-redis
```

### Database connection errors

```bash
# Check PostgreSQL logs
docker logs wasper-postgres

# Test connection
docker exec -it wasper-postgres psql -U wasper -d wasper

# Reset database (CAUTION: destroys data)
docker compose -f /opt/wasper/docker-compose.azure.yml down -v
sudo rm -rf /mnt/data/postgres/*
docker compose -f /opt/wasper/docker-compose.azure.yml up -d
```

### SSL certificate issues

```bash
# Check certificate expiry
sudo certbot certificates

# Manual renewal
sudo /opt/wasper/renew-ssl.sh

# Check renewal logs
cat /var/log/wasper-ssl-renewal.log

# Test SSL
curl -I https://wasper.yourdomain.com
```

### DNS not resolving

```bash
# Check DNS from multiple servers
dig +short wasper.yourdomain.com @8.8.8.8
dig +short wasper.yourdomain.com @1.1.1.1

# Check if proxy is enabled in Cloudflare (should be OFF)
# Orange cloud = ON (wrong)
# Grey cloud = OFF (correct)
```

### Can't access Wasper

```bash
# Check firewall
sudo ufw status

# Check nginx
docker logs wasper-nginx
curl http://localhost

# Check if Wasper is running
docker ps | grep wasper
curl http://localhost:80/api/v1/health
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Check largest directories
du -sh /mnt/data/*
du -sh /var/lib/docker/*
```

---

## Backup and Restore

### Automatic Backups

Backups are stored in `/mnt/data/backups/` and kept for 7 days.

```bash
# Manual backup
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh backup

# List backups
ls -lh /mnt/data/backups/

# Restore from backup
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh restore
```

### Manual Database Backup

```bash
# Backup database
docker exec wasper-postgres pg_dump -U wasper wasper | gzip > wasper_db_$(date +%Y%m%d).sql.gz

# Restore database
gunzip -c wasper_db_20240101.sql.gz | docker exec -i wasper-postgres psql -U wasper wasper
```

### Backup Environment File

```bash
# Backup .env file (contains secrets!)
sudo cp /opt/wasper/.env /mnt/data/backups/env_$(date +%Y%m%d)
```

### Full System Backup (Azure)

```bash
# Create VM snapshot in Azure Portal
# OR use Azure CLI
az snapshot create \
  --resource-group wasper-rg \
  --source wasper-vm \
  --name wasper-snapshot-$(date +%Y%m%d)
```

---

## Upgrading

### Update Wasper

```bash
# Using management script (recommended)
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh update

# Manual update
cd /opt/wasper
git pull
docker compose -f docker-compose.azure.yml pull
docker compose -f docker-compose.azure.yml up -d
```

### Upgrade VM Size

```bash
# Stop VM in Azure Portal
# Change VM size (e.g., Standard_D2s_v3 → Standard_D4s_v3)
# Start VM
# No data loss, automatic resize
```

### Update Docker Images

```bash
# Edit docker-compose.azure.yml
nano /opt/wasper/docker-compose.azure.yml

# Change version
# activepieces/activepieces:0.71.2 → activepieces/activepieces:latest

# Apply changes
docker compose -f /opt/wasper/docker-compose.azure.yml pull
docker compose -f /opt/wasper/docker-compose.azure.yml up -d
```

---

## Environment Variables Reference

See `/opt/wasper/.env` for all configuration options.

**Critical Security Variables:**
- `AP_ENCRYPTION_KEY` - Data encryption (32 chars hex)
- `AP_JWT_SECRET` - Session tokens (32 chars hex)
- `AP_API_KEY` - API authentication (64 chars hex)
- `POSTGRES_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password

**Application Settings:**
- `AP_FRONTEND_URL` - Public URL (must match domain)
- `AP_ENVIRONMENT` - `prod` or `dev`
- `AP_EXECUTION_MODE` - `UNSANDBOXED`, `SANDBOX_CODE_ONLY`, etc.
- `AP_WORKER_CONCURRENCY` - Concurrent flows (default: 10)

**Full documentation:** https://www.activepieces.com/docs/install/configurations/environment-variables

---

## Security Best Practices

1. **Change default admin password** immediately after first login
2. **Keep .env file secure** - contains secrets
3. **Enable automatic updates:**
   ```bash
   sudo apt-get install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```
4. **Restrict SSH access** to specific IPs in Azure NSG
5. **Enable Azure Security Center** for monitoring
6. **Regular backups** - automated daily
7. **Monitor logs** for suspicious activity
8. **Keep Docker images updated**

---

## Support and Resources

- **Wasper Repository:** https://github.com/mjaftueshem/wasper
- **Activepieces Documentation:** https://www.activepieces.com/docs
- **Azure Documentation:** https://docs.microsoft.com/azure
- **Cloudflare Documentation:** https://developers.cloudflare.com
- **Docker Compose Documentation:** https://docs.docker.com/compose

---

## Quick Reference

```bash
# Start Wasper
sudo systemctl start wasper

# View logs
docker compose -f /opt/wasper/docker-compose.azure.yml logs -f

# Backup
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh backup

# Restart
sudo systemctl restart wasper

# Health check
curl https://wasper.yourdomain.com/api/v1/health

# SSL renewal
sudo /opt/wasper/renew-ssl.sh
```

---

## License

Wasper is a fork of Activepieces (MIT License)
