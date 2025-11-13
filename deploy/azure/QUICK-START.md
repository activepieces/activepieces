# Wasper Azure Quick Start Guide

Get Wasper running on Azure in under 30 minutes!

## Prerequisites

- [ ] Azure account with $150/month credit
- [ ] Domain name (e.g., `example.com`)
- [ ] Cloudflare account managing the domain
- [ ] SSH key pair (`ssh-keygen -t rsa -b 4096`)

## Step 1: Choose Your Subdomain

Decide on a subdomain for Wasper. Examples:
- `wasper.example.com`
- `automation.example.com`
- `flows.example.com`

For this guide, we'll use `wasper.example.com`

## Step 2: Deploy Azure VM

### Option A: Using Terraform (Recommended)

```bash
# Clone repository
git clone https://github.com/mjaftueshem/wasper.git
cd wasper/deploy/azure/terraform

# Configure
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# Update these values:
# - domain_name = "wasper.example.com"
# - ssh_public_key_path = "~/.ssh/id_rsa.pub"

# Login to Azure
az login

# Deploy
terraform init
terraform apply

# Get VM IP
terraform output public_ip_address
# Example output: 20.123.45.67
```

### Option B: Azure Portal (Manual)

1. Go to https://portal.azure.com
2. Create Resource Group: `wasper-rg`
3. Create VM:
   - Name: `wasper-vm`
   - Image: `Ubuntu 22.04 LTS`
   - Size: `Standard_D2s_v3` (2 vCPU, 8GB RAM)
   - Authentication: SSH key
   - Ports: 22, 80, 443
4. Add Data Disk: 128GB Premium SSD
5. Note the Public IP address

## Step 3: Setup VM

```bash
# SSH into VM (replace with your IP)
ssh wasperadmin@20.123.45.67

# Clone repository
sudo mkdir -p /opt/wasper
cd /opt/wasper
sudo git clone https://github.com/mjaftueshem/wasper.git .

# Run setup script (replace with your domain)
cd deploy/azure/scripts
sudo ./setup-vm.sh wasper.example.com
```

**This takes ~5 minutes and will:**
- Install Docker
- Setup database and Redis
- Generate secure keys
- Start Wasper services

**Save the output!** It contains your VM IP and next steps.

## Step 4: Configure DNS in Cloudflare

### Option A: Automated

```bash
# On your local machine (not VM)
cd wasper/deploy/azure/cloudflare

# Get Cloudflare API token from:
# https://dash.cloudflare.com/profile/api-tokens
# Create Token → Edit zone DNS → Copy token

./setup-dns.sh wasper example.com YOUR_CLOUDFLARE_TOKEN

# Wait 5-10 minutes for DNS propagation
```

### Option B: Manual

1. Login to https://dash.cloudflare.com
2. Select your domain
3. Go to **DNS → Records**
4. Click **Add record**
5. Configure:
   - Type: `A`
   - Name: `wasper`
   - IPv4 address: `20.123.45.67` (your VM IP)
   - Proxy status: **DNS only** (grey cloud)
   - TTL: Auto
6. Click **Save**

**Wait 5-30 minutes for DNS propagation**

## Step 5: Verify DNS

```bash
# Check DNS resolution
dig +short wasper.example.com

# Should return your VM IP
# 20.123.45.67
```

## Step 6: Setup SSL Certificate

```bash
# SSH into VM
ssh wasperadmin@20.123.45.67

# Setup SSL (replace with your domain and email)
sudo /opt/wasper/deploy/azure/scripts/setup-ssl.sh wasper.example.com your-email@example.com
```

**This takes ~2 minutes and will:**
- Obtain free Let's Encrypt certificate
- Configure Nginx with SSL
- Setup automatic renewal

## Step 7: Access Wasper

Open your browser and go to:

```
https://wasper.example.com
```

**First time setup:**
1. You'll see the Wasper welcome screen
2. Create your admin account
3. Set up your first automation flow!

## Verification Checklist

- [ ] VM is running in Azure
- [ ] DNS resolves to VM IP (`dig +short wasper.example.com`)
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] Can access https://wasper.example.com
- [ ] Can create admin account
- [ ] Services are healthy: `docker ps`

## Common Issues

### "DNS not found" error

**Problem:** DNS hasn't propagated yet

**Solution:** Wait 5-30 minutes, check with `dig +short wasper.example.com`

### "SSL certificate error"

**Problem:** Either:
1. DNS not configured correctly
2. Cloudflare proxy is enabled (orange cloud)
3. DNS hasn't propagated

**Solution:**
1. Verify DNS: `dig +short wasper.example.com`
2. Turn off Cloudflare proxy (grey cloud)
3. Wait for DNS, then re-run SSL setup

### "Can't connect" error

**Problem:** Firewall blocking ports

**Solution:**
```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### "Service not running"

**Problem:** Docker services crashed

**Solution:**
```bash
# Check status
docker ps

# View logs
docker compose -f /opt/wasper/docker-compose.azure.yml logs

# Restart services
sudo systemctl restart wasper
```

## What's Running?

```bash
# Check all services
docker ps

# Expected output:
# wasper-nginx      (reverse proxy, SSL)
# wasper-app        (main application)
# wasper-postgres   (database)
# wasper-redis      (message queue)
```

## Next Steps

### Customize Settings

```bash
# Edit environment variables
sudo nano /opt/wasper/.env

# Restart to apply changes
sudo systemctl restart wasper
```

### View Logs

```bash
# All logs
docker compose -f /opt/wasper/docker-compose.azure.yml logs -f

# Specific service
docker logs -f wasper-app
```

### Backup Database

```bash
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh backup
```

### Update Wasper

```bash
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh update
```

## Cost Tracking

Monitor your Azure spending:

1. Go to https://portal.azure.com
2. Navigate to **Cost Management + Billing**
3. Check **Cost Analysis**

Expected: **~$118-123/month**

## Support

- **Full Documentation:** `/deploy/azure/README.md`
- **Wasper Repository:** https://github.com/mjaftueshem/wasper
- **Activepieces Docs:** https://www.activepieces.com/docs

## Quick Commands Reference

```bash
# Start Wasper
sudo systemctl start wasper

# Stop Wasper
sudo systemctl stop wasper

# Restart Wasper
sudo systemctl restart wasper

# View status
sudo systemctl status wasper

# View logs
docker compose -f /opt/wasper/docker-compose.azure.yml logs -f

# Health check
curl https://wasper.example.com/api/v1/health

# Backup
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh backup

# Update
sudo /opt/wasper/deploy/azure/scripts/manage-wasper.sh update
```

---

**Congratulations!** You now have Wasper running on Azure with SSL! 🎉
