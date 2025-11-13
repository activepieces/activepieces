#!/bin/bash
set -euo pipefail

################################################################################
# Wasper SSL Certificate Setup Script (Let's Encrypt)
#
# This script sets up free SSL certificates using Let's Encrypt
# Run as: sudo ./setup-ssl.sh <domain-name> <email>
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

# Get parameters
DOMAIN_NAME="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN_NAME" ]; then
    log_error "Usage: sudo ./setup-ssl.sh <domain-name> <email>"
    log_error "Example: sudo ./setup-ssl.sh wasper.example.com admin@example.com"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    log_error "Email is required for Let's Encrypt notifications"
    log_error "Usage: sudo ./setup-ssl.sh <domain-name> <email>"
    exit 1
fi

log_info "Setting up SSL certificate for: $DOMAIN_NAME"

################################################################################
# 1. Install Certbot
################################################################################
log_info "Installing Certbot..."

if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    log_info "Certbot installed successfully"
else
    log_info "Certbot already installed"
fi

################################################################################
# 2. Verify DNS Configuration
################################################################################
log_info "Verifying DNS configuration..."

EXPECTED_IP=$(curl -s ifconfig.me)
ACTUAL_IP=$(dig +short "$DOMAIN_NAME" @8.8.8.8 | tail -n1)

log_info "Expected IP (this server): $EXPECTED_IP"
log_info "Actual IP (DNS): $ACTUAL_IP"

if [ "$EXPECTED_IP" != "$ACTUAL_IP" ]; then
    log_error "DNS mismatch! Please configure your DNS before running this script."
    log_error "Add an A record in Cloudflare:"
    log_error "  Name: $DOMAIN_NAME"
    log_error "  Type: A"
    log_error "  Content: $EXPECTED_IP"
    log_error "  Proxy: OFF (disable orange cloud)"
    log_error ""
    log_error "Wait for DNS propagation (5-30 minutes) then run this script again."
    exit 1
fi

log_info "DNS configuration verified ✓"

################################################################################
# 3. Stop Nginx temporarily
################################################################################
log_info "Stopping Nginx temporarily for certificate generation..."
cd /opt/wasper
docker compose -f docker-compose.azure.yml stop nginx

################################################################################
# 4. Obtain SSL Certificate
################################################################################
log_info "Obtaining SSL certificate from Let's Encrypt..."

certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN_NAME" \
    --preferred-challenges http

if [ $? -ne 0 ]; then
    log_error "Failed to obtain SSL certificate"
    log_error "Please check:"
    log_error "  1. DNS is correctly configured"
    log_error "  2. Port 80 is accessible from the internet"
    log_error "  3. Domain name is correct"
    docker compose -f /opt/wasper/docker-compose.azure.yml start nginx
    exit 1
fi

log_info "SSL certificate obtained successfully ✓"

################################################################################
# 5. Copy Certificates to Nginx Directory
################################################################################
log_info "Copying certificates to Nginx directory..."

SSL_DIR="/mnt/data/nginx-ssl"
mkdir -p "$SSL_DIR"

cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$SSL_DIR/cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$SSL_DIR/key.pem"

chmod 644 "$SSL_DIR/cert.pem"
chmod 600 "$SSL_DIR/key.pem"

log_info "Certificates copied to $SSL_DIR"

################################################################################
# 6. Setup Auto-Renewal
################################################################################
log_info "Setting up automatic certificate renewal..."

# Create renewal script
cat > /opt/wasper/renew-ssl.sh <<'RENEWEOF'
#!/bin/bash
# Auto-renewal script for SSL certificates

# Stop nginx
docker compose -f /opt/wasper/docker-compose.azure.yml stop nginx

# Renew certificate
certbot renew --quiet

# Copy new certificates
cp /etc/letsencrypt/live/*/fullchain.pem /mnt/data/nginx-ssl/cert.pem
cp /etc/letsencrypt/live/*/privkey.pem /mnt/data/nginx-ssl/key.pem

# Restart nginx
docker compose -f /opt/wasper/docker-compose.azure.yml start nginx

echo "SSL certificate renewed successfully - $(date)" >> /var/log/wasper-ssl-renewal.log
RENEWEOF

chmod +x /opt/wasper/renew-ssl.sh

# Add cron job for auto-renewal (runs daily at 3 AM)
CRON_CMD="0 3 * * * /opt/wasper/renew-ssl.sh >> /var/log/wasper-ssl-renewal.log 2>&1"

if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    log_info "Auto-renewal cron job added"
else
    log_info "Auto-renewal cron job already exists"
fi

################################################################################
# 7. Restart Nginx
################################################################################
log_info "Restarting Nginx with SSL configuration..."
docker compose -f /opt/wasper/docker-compose.azure.yml start nginx

# Wait for nginx to start
sleep 5

################################################################################
# 8. Test SSL Configuration
################################################################################
log_info "Testing SSL configuration..."

if curl -sSf "https://$DOMAIN_NAME" > /dev/null 2>&1; then
    log_info "SSL configuration successful ✓"
else
    log_warn "SSL test failed - please check the logs"
    docker compose -f /opt/wasper/docker-compose.azure.yml logs nginx
fi

################################################################################
# 9. Display Status
################################################################################
echo ""
echo "════════════════════════════════════════════════════════════════"
log_info "SSL Setup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Domain: $DOMAIN_NAME"
echo "Certificate Location: /etc/letsencrypt/live/$DOMAIN_NAME/"
echo "Certificate Valid Until: $(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)"
echo ""
echo "Auto-Renewal:"
echo "  - Renewal script: /opt/wasper/renew-ssl.sh"
echo "  - Cron schedule: Daily at 3:00 AM"
echo "  - Renewal log: /var/log/wasper-ssl-renewal.log"
echo ""
echo "Access Wasper:"
echo "  https://$DOMAIN_NAME"
echo ""
echo "To manually renew certificate:"
echo "  sudo /opt/wasper/renew-ssl.sh"
echo ""
echo "════════════════════════════════════════════════════════════════"
