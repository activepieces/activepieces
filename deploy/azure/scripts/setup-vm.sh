#!/bin/bash
set -euo pipefail

################################################################################
# Wasper Azure VM Setup Script
#
# This script sets up the complete Wasper environment on an Azure VM
# Run as: sudo ./setup-vm.sh <domain-name>
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get domain name from argument
DOMAIN_NAME="${1:-}"
if [ -z "$DOMAIN_NAME" ]; then
    log_error "Usage: sudo ./setup-vm.sh <domain-name>"
    log_error "Example: sudo ./setup-vm.sh wasper.example.com"
    exit 1
fi

log_info "Starting Wasper setup for domain: $DOMAIN_NAME"

################################################################################
# 1. System Update and Dependencies
################################################################################
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y

log_info "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    wget \
    ufw \
    openssl \
    jq

################################################################################
# 2. Docker Installation
################################################################################
log_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    log_info "Docker installed successfully"
else
    log_info "Docker already installed"
fi

# Add current user to docker group (if not root)
if [ -n "${SUDO_USER:-}" ]; then
    usermod -aG docker "$SUDO_USER"
    log_info "Added $SUDO_USER to docker group"
fi

################################################################################
# 3. Firewall Configuration
################################################################################
log_info "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw status
log_info "Firewall configured"

################################################################################
# 4. Data Disk Setup
################################################################################
log_info "Setting up data disk..."
DATA_MOUNT="/mnt/data"

if [ -e /dev/disk/azure/scsi1/lun0 ]; then
    if ! mount | grep -q "$DATA_MOUNT"; then
        log_info "Formatting and mounting data disk..."
        mkfs.ext4 -F /dev/disk/azure/scsi1/lun0
        mkdir -p "$DATA_MOUNT"
        mount /dev/disk/azure/scsi1/lun0 "$DATA_MOUNT"

        # Add to fstab if not already there
        if ! grep -q "$DATA_MOUNT" /etc/fstab; then
            echo '/dev/disk/azure/scsi1/lun0 /mnt/data ext4 defaults,nofail 0 2' >> /etc/fstab
        fi
        log_info "Data disk mounted at $DATA_MOUNT"
    else
        log_info "Data disk already mounted"
    fi
else
    log_warn "Data disk not found at /dev/disk/azure/scsi1/lun0 - using local storage"
    DATA_MOUNT="/opt/wasper-data"
fi

################################################################################
# 5. Directory Structure
################################################################################
log_info "Creating directory structure..."
mkdir -p /opt/wasper
mkdir -p "$DATA_MOUNT/postgres"
mkdir -p "$DATA_MOUNT/redis"
mkdir -p "$DATA_MOUNT/wasper-data"
mkdir -p "$DATA_MOUNT/nginx-ssl"

# Set permissions
chown -R 1000:1000 "$DATA_MOUNT"

################################################################################
# 6. Clone Wasper Repository
################################################################################
log_info "Cloning Wasper repository..."
if [ ! -d "/opt/wasper/.git" ]; then
    cd /opt/wasper
    git clone https://github.com/mjaftueshem/wasper.git .
    log_info "Repository cloned successfully"
else
    log_info "Repository already exists, pulling latest changes..."
    cd /opt/wasper
    git pull
fi

################################################################################
# 7. Generate Secure Environment Variables
################################################################################
log_info "Generating secure environment variables..."

ENCRYPTION_KEY=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
API_KEY=$(openssl rand -hex 64)
POSTGRES_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)

cat > /opt/wasper/.env <<EOF
# Auto-generated Wasper Configuration
# Generated: $(date)
# Domain: $DOMAIN_NAME

# Security Keys (KEEP THESE SECRET!)
AP_ENCRYPTION_KEY=$ENCRYPTION_KEY
AP_JWT_SECRET=$JWT_SECRET
AP_API_KEY=$API_KEY

# Database Configuration
AP_POSTGRES_HOST=postgres
AP_POSTGRES_PORT=5432
AP_POSTGRES_USERNAME=wasper
AP_POSTGRES_PASSWORD=$POSTGRES_PASSWORD
AP_POSTGRES_DATABASE=wasper
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Redis Configuration
AP_REDIS_HOST=redis
AP_REDIS_PORT=6379
AP_REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD

# Application Configuration
AP_FRONTEND_URL=https://$DOMAIN_NAME
AP_ENVIRONMENT=prod
AP_EDITION=ce
AP_TELEMETRY_ENABLED=true

# Execution Configuration
AP_EXECUTION_MODE=UNSANDBOXED
AP_WORKER_CONCURRENCY=10
AP_AGENTS_WORKER_CONCURRENCY=10

# Timeouts
AP_FLOW_TIMEOUT_SECONDS=600
AP_WEBHOOK_TIMEOUT_SECONDS=30

# Storage Configuration
AP_FILE_STORAGE_LOCATION=DB
AP_MAX_FILE_SIZE_MB=10
AP_EXECUTION_DATA_RETENTION_DAYS=30

# Other
AP_TEMPLATES_SOURCE_URL=https://cloud.activepieces.com/api/v1/flow-templates
EOF

chmod 600 /opt/wasper/.env
log_info "Environment file created at /opt/wasper/.env"

################################################################################
# 8. Create Docker Compose Configuration
################################################################################
log_info "Creating Docker Compose configuration..."

cat > /opt/wasper/docker-compose.azure.yml <<'EOF'
version: "3.8"

services:
  postgres:
    image: postgres:14.13
    container_name: wasper-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${AP_POSTGRES_DATABASE:-wasper}
      POSTGRES_USER: ${AP_POSTGRES_USERNAME:-wasper}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /mnt/data/postgres:/var/lib/postgresql/data
    networks:
      - wasper-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${AP_POSTGRES_USERNAME:-wasper}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.4.1
    container_name: wasper-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - /mnt/data/redis:/data
    networks:
      - wasper-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  wasper:
    image: activepieces/activepieces:0.71.2
    container_name: wasper-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      AP_ENCRYPTION_KEY: ${AP_ENCRYPTION_KEY}
      AP_JWT_SECRET: ${AP_JWT_SECRET}
      AP_API_KEY: ${AP_API_KEY}
      AP_POSTGRES_HOST: ${AP_POSTGRES_HOST}
      AP_POSTGRES_PORT: ${AP_POSTGRES_PORT}
      AP_POSTGRES_USERNAME: ${AP_POSTGRES_USERNAME}
      AP_POSTGRES_PASSWORD: ${AP_POSTGRES_PASSWORD}
      AP_POSTGRES_DATABASE: ${AP_POSTGRES_DATABASE}
      AP_REDIS_HOST: ${AP_REDIS_HOST}
      AP_REDIS_PORT: ${AP_REDIS_PORT}
      AP_REDIS_PASSWORD: ${AP_REDIS_PASSWORD}
      AP_FRONTEND_URL: ${AP_FRONTEND_URL}
      AP_ENVIRONMENT: ${AP_ENVIRONMENT:-prod}
      AP_EDITION: ${AP_EDITION:-ce}
      AP_TELEMETRY_ENABLED: ${AP_TELEMETRY_ENABLED:-true}
      AP_EXECUTION_MODE: ${AP_EXECUTION_MODE:-UNSANDBOXED}
      AP_WORKER_CONCURRENCY: ${AP_WORKER_CONCURRENCY:-10}
      AP_AGENTS_WORKER_CONCURRENCY: ${AP_AGENTS_WORKER_CONCURRENCY:-10}
      AP_FLOW_TIMEOUT_SECONDS: ${AP_FLOW_TIMEOUT_SECONDS:-600}
      AP_WEBHOOK_TIMEOUT_SECONDS: ${AP_WEBHOOK_TIMEOUT_SECONDS:-30}
      AP_FILE_STORAGE_LOCATION: ${AP_FILE_STORAGE_LOCATION:-DB}
      AP_MAX_FILE_SIZE_MB: ${AP_MAX_FILE_SIZE_MB:-10}
      AP_EXECUTION_DATA_RETENTION_DAYS: ${AP_EXECUTION_DATA_RETENTION_DAYS:-30}
      AP_TEMPLATES_SOURCE_URL: ${AP_TEMPLATES_SOURCE_URL}
    volumes:
      - /mnt/data/wasper-data:/usr/src/app/cache
    networks:
      - wasper-network
    expose:
      - "80"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:80/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: wasper-nginx
    restart: unless-stopped
    depends_on:
      - wasper
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.azure.conf:/etc/nginx/nginx.conf:ro
      - /mnt/data/nginx-ssl:/etc/nginx/ssl:ro
    networks:
      - wasper-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:80/health"]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  wasper-network:
    driver: bridge
EOF

log_info "Docker Compose configuration created"

################################################################################
# 9. Create Nginx Configuration
################################################################################
log_info "Creating Nginx configuration..."

cat > /opt/wasper/nginx.azure.conf <<'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Upstream
    upstream wasper_backend {
        server wasper:80;
    }

    # HTTP Server - Redirect to HTTPS
    server {
        listen 80;
        server_name _;

        # Health check endpoint (no redirect)
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL Configuration (will be configured by setup-ssl.sh)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Proxy to Wasper
        location / {
            proxy_pass http://wasper_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
NGINXEOF

log_info "Nginx configuration created"

################################################################################
# 10. Create Systemd Service
################################################################################
log_info "Creating systemd service..."

cat > /etc/systemd/system/wasper.service <<'SERVICEEOF'
[Unit]
Description=Wasper (Activepieces) Docker Compose Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/wasper
ExecStart=/usr/bin/docker compose -f docker-compose.azure.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.azure.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable wasper.service
log_info "Systemd service created and enabled"

################################################################################
# 11. Generate Self-Signed SSL Certificate (temporary)
################################################################################
log_info "Generating temporary self-signed SSL certificate..."
mkdir -p "$DATA_MOUNT/nginx-ssl"

if [ ! -f "$DATA_MOUNT/nginx-ssl/cert.pem" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$DATA_MOUNT/nginx-ssl/key.pem" \
        -out "$DATA_MOUNT/nginx-ssl/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN_NAME"

    chmod 600 "$DATA_MOUNT/nginx-ssl/key.pem"
    chmod 644 "$DATA_MOUNT/nginx-ssl/cert.pem"
    log_info "Self-signed certificate created (replace with Let's Encrypt later)"
else
    log_info "SSL certificate already exists"
fi

################################################################################
# 12. Start Wasper
################################################################################
log_info "Starting Wasper services..."
cd /opt/wasper
docker compose -f docker-compose.azure.yml up -d

log_info "Waiting for services to be healthy..."
sleep 30

################################################################################
# 13. Display Status
################################################################################
echo ""
echo "════════════════════════════════════════════════════════════════"
log_info "Wasper Setup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Domain: $DOMAIN_NAME"
echo "Installation Directory: /opt/wasper"
echo "Data Directory: $DATA_MOUNT"
echo "Environment File: /opt/wasper/.env"
echo ""
echo "Services Status:"
docker compose -f /opt/wasper/docker-compose.azure.yml ps
echo ""
echo "Next Steps:"
echo "1. Configure DNS A record in Cloudflare:"
echo "   - Name: $DOMAIN_NAME"
echo "   - Type: A"
echo "   - Content: $(curl -s ifconfig.me)"
echo "   - Proxy: OFF (orange cloud disabled)"
echo ""
echo "2. Setup SSL certificate with Let's Encrypt:"
echo "   sudo /opt/wasper/deploy/azure/scripts/setup-ssl.sh $DOMAIN_NAME"
echo ""
echo "3. Access Wasper:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "Useful Commands:"
echo "  - View logs: docker compose -f /opt/wasper/docker-compose.azure.yml logs -f"
echo "  - Restart: sudo systemctl restart wasper"
echo "  - Stop: sudo systemctl stop wasper"
echo "  - Status: sudo systemctl status wasper"
echo ""
echo "════════════════════════════════════════════════════════════════"
