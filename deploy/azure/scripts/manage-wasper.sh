#!/bin/bash
set -euo pipefail

################################################################################
# Wasper Management Script
#
# Utility script for managing Wasper on Azure VM
################################################################################

COMPOSE_FILE="/opt/wasper/docker-compose.azure.yml"

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

show_help() {
    cat <<EOF
Wasper Management Script

Usage: sudo ./manage-wasper.sh <command>

Commands:
  start           Start Wasper services
  stop            Stop Wasper services
  restart         Restart Wasper services
  status          Show status of all services
  logs            Show logs (add service name: logs wasper)
  update          Update to latest version
  backup          Backup database and configuration
  restore         Restore from backup
  health          Check health of all services
  stats           Show resource usage statistics
  clean           Clean up old images and volumes
  help            Show this help message

Examples:
  sudo ./manage-wasper.sh start
  sudo ./manage-wasper.sh logs wasper
  sudo ./manage-wasper.sh backup
EOF
}

cmd_start() {
    log_info "Starting Wasper services..."
    cd /opt/wasper
    docker compose -f "$COMPOSE_FILE" up -d
    log_info "Wasper services started"
}

cmd_stop() {
    log_info "Stopping Wasper services..."
    cd /opt/wasper
    docker compose -f "$COMPOSE_FILE" down
    log_info "Wasper services stopped"
}

cmd_restart() {
    log_info "Restarting Wasper services..."
    cmd_stop
    sleep 3
    cmd_start
}

cmd_status() {
    log_info "Wasper Services Status:"
    echo ""
    cd /opt/wasper
    docker compose -f "$COMPOSE_FILE" ps
}

cmd_logs() {
    SERVICE="${1:-}"
    cd /opt/wasper
    if [ -z "$SERVICE" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f --tail=100
    else
        docker compose -f "$COMPOSE_FILE" logs -f --tail=100 "$SERVICE"
    fi
}

cmd_update() {
    log_info "Updating Wasper..."

    # Backup first
    log_info "Creating backup before update..."
    cmd_backup

    # Pull latest code
    log_info "Pulling latest code..."
    cd /opt/wasper
    git pull

    # Pull new images
    log_info "Pulling new Docker images..."
    docker compose -f "$COMPOSE_FILE" pull

    # Restart services
    log_info "Restarting services..."
    docker compose -f "$COMPOSE_FILE" up -d

    log_info "Update complete!"
}

cmd_backup() {
    BACKUP_DIR="/mnt/data/backups"
    mkdir -p "$BACKUP_DIR"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/wasper_backup_$TIMESTAMP.tar.gz"

    log_info "Creating backup: $BACKUP_FILE"

    # Backup database
    log_info "Backing up PostgreSQL database..."
    docker exec wasper-postgres pg_dump -U wasper wasper | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

    # Backup environment file
    log_info "Backing up configuration..."
    cp /opt/wasper/.env "$BACKUP_DIR/env_$TIMESTAMP"

    # Create combined archive
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_FILE" "db_$TIMESTAMP.sql.gz" "env_$TIMESTAMP"
    rm "db_$TIMESTAMP.sql.gz" "env_$TIMESTAMP"

    log_info "Backup created: $BACKUP_FILE"

    # Keep only last 7 backups
    ls -t "$BACKUP_DIR"/wasper_backup_*.tar.gz | tail -n +8 | xargs -r rm
    log_info "Old backups cleaned up (keeping last 7)"
}

cmd_restore() {
    BACKUP_DIR="/mnt/data/backups"

    # List available backups
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR"/wasper_backup_*.tar.gz 2>/dev/null || {
        log_error "No backups found in $BACKUP_DIR"
        exit 1
    }

    echo ""
    read -p "Enter backup filename to restore: " BACKUP_FILE

    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
        exit 1
    fi

    log_warn "This will overwrite current data. Are you sure? (yes/no)"
    read -p "> " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    # Extract backup
    log_info "Extracting backup..."
    cd "$BACKUP_DIR"
    tar -xzf "$BACKUP_FILE"

    # Restore database
    log_info "Restoring database..."
    DB_FILE=$(ls -t db_*.sql.gz | head -1)
    gunzip -c "$DB_FILE" | docker exec -i wasper-postgres psql -U wasper wasper

    # Restore environment
    log_info "Restoring configuration..."
    ENV_FILE=$(ls -t env_* | head -1)
    cp "$ENV_FILE" /opt/wasper/.env

    # Restart services
    log_info "Restarting services..."
    cmd_restart

    log_info "Restore complete!"
}

cmd_health() {
    log_info "Checking Wasper health..."
    echo ""

    # Check Docker containers
    log_info "Container Status:"
    docker ps --filter "name=wasper-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    # Check health endpoints
    log_info "Health Endpoints:"

    if curl -sf http://localhost:80/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Wasper API: Healthy"
    else
        echo -e "${RED}✗${NC} Wasper API: Unhealthy"
    fi

    if docker exec wasper-postgres pg_isready -U wasper > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL: Healthy"
    else
        echo -e "${RED}✗${NC} PostgreSQL: Unhealthy"
    fi

    if docker exec wasper-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis: Healthy"
    else
        echo -e "${RED}✗${NC} Redis: Unhealthy"
    fi

    echo ""
}

cmd_stats() {
    log_info "Resource Usage Statistics:"
    echo ""
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" \
        $(docker ps --filter "name=wasper-" -q)
}

cmd_clean() {
    log_info "Cleaning up Docker resources..."

    log_info "Removing unused images..."
    docker image prune -af

    log_info "Removing unused volumes..."
    docker volume prune -f

    log_info "Removing unused networks..."
    docker network prune -f

    log_info "Cleanup complete!"
}

# Main command router
COMMAND="${1:-help}"

case "$COMMAND" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "${2:-}"
        ;;
    update)
        cmd_update
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore
        ;;
    health)
        cmd_health
        ;;
    stats)
        cmd_stats
        ;;
    clean)
        cmd_clean
        ;;
    help|*)
        show_help
        ;;
esac
