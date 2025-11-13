#!/bin/bash
set -euo pipefail

################################################################################
# Cloudflare DNS Setup Script for Wasper
#
# This script helps configure Cloudflare DNS via API
# Run as: ./setup-dns.sh <subdomain> <domain> <cloudflare-api-token>
################################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Install with: sudo apt-get install jq"
    exit 1
fi

# Get parameters
SUBDOMAIN="${1:-}"
DOMAIN="${2:-}"
CF_API_TOKEN="${3:-}"

if [ -z "$SUBDOMAIN" ] || [ -z "$DOMAIN" ] || [ -z "$CF_API_TOKEN" ]; then
    echo "Usage: ./setup-dns.sh <subdomain> <domain> <cloudflare-api-token>"
    echo ""
    echo "Example: ./setup-dns.sh wasper example.com cf_token_here"
    echo ""
    echo "This will create: wasper.example.com"
    echo ""
    echo "To get a Cloudflare API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create Token > Edit zone DNS (use template)"
    echo "3. Select your domain zone"
    echo "4. Copy the token"
    exit 1
fi

FQDN="$SUBDOMAIN.$DOMAIN"

log_info "Configuring DNS for: $FQDN"

################################################################################
# 1. Get Public IP
################################################################################
log_info "Getting public IP address..."
PUBLIC_IP=$(curl -s ifconfig.me)

if [ -z "$PUBLIC_IP" ]; then
    log_error "Failed to get public IP address"
    exit 1
fi

log_info "Public IP: $PUBLIC_IP"

################################################################################
# 2. Get Cloudflare Zone ID
################################################################################
log_info "Getting Cloudflare Zone ID for $DOMAIN..."

ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json")

ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id')

if [ "$ZONE_ID" == "null" ] || [ -z "$ZONE_ID" ]; then
    log_error "Failed to get Zone ID. Check your API token and domain name."
    echo "Response: $ZONE_RESPONSE"
    exit 1
fi

log_info "Zone ID: $ZONE_ID"

################################################################################
# 3. Check if DNS record exists
################################################################################
log_info "Checking for existing DNS record..."

EXISTING_RECORD=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$FQDN" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json")

RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.result[0].id')

################################################################################
# 4. Create or Update DNS Record
################################################################################
if [ "$RECORD_ID" != "null" ] && [ -n "$RECORD_ID" ]; then
    log_info "DNS record exists, updating..."

    UPDATE_RESPONSE=$(curl -s -X PUT \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"A\",
            \"name\": \"$SUBDOMAIN\",
            \"content\": \"$PUBLIC_IP\",
            \"ttl\": 3600,
            \"proxied\": false
        }")

    SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success')

    if [ "$SUCCESS" == "true" ]; then
        log_info "DNS record updated successfully ✓"
    else
        log_error "Failed to update DNS record"
        echo "Response: $UPDATE_RESPONSE"
        exit 1
    fi
else
    log_info "Creating new DNS record..."

    CREATE_RESPONSE=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"A\",
            \"name\": \"$SUBDOMAIN\",
            \"content\": \"$PUBLIC_IP\",
            \"ttl\": 3600,
            \"proxied\": false,
            \"comment\": \"Wasper Azure VM - Created $(date)\"
        }")

    SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')

    if [ "$SUCCESS" == "true" ]; then
        log_info "DNS record created successfully ✓"
    else
        log_error "Failed to create DNS record"
        echo "Response: $CREATE_RESPONSE"
        exit 1
    fi
fi

################################################################################
# 5. Verify DNS Configuration
################################################################################
log_info "Waiting 10 seconds for DNS to propagate..."
sleep 10

log_info "Verifying DNS configuration..."

RESOLVED_IP=$(dig +short "$FQDN" @1.1.1.1 | tail -n1)

log_info "Expected IP: $PUBLIC_IP"
log_info "Resolved IP: $RESOLVED_IP"

if [ "$RESOLVED_IP" == "$PUBLIC_IP" ]; then
    log_info "DNS verification successful ✓"
else
    log_warn "DNS not yet propagated. This may take 5-30 minutes."
    log_warn "You can check manually with: dig +short $FQDN"
fi

################################################################################
# Summary
################################################################################
echo ""
echo "════════════════════════════════════════════════════════════════"
log_info "DNS Configuration Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Domain: $FQDN"
echo "IP Address: $PUBLIC_IP"
echo "TTL: 3600 seconds (1 hour)"
echo "Proxied: No (required for Let's Encrypt)"
echo ""
echo "Next Steps:"
echo "1. Wait for DNS propagation (5-30 minutes)"
echo "2. Verify DNS: dig +short $FQDN"
echo "3. Setup SSL certificate:"
echo "   sudo /opt/wasper/deploy/azure/scripts/setup-ssl.sh $FQDN your-email@example.com"
echo ""
echo "════════════════════════════════════════════════════════════════"
