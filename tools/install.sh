#!/usr/bin/env sh
# Activepieces installer.
#
#   install:    curl -fsSL https://get.activepieces.com | sh
#   upgrade:    curl -fsSL https://get.activepieces.com | sh -s -- --upgrade
#   uninstall:  curl -fsSL https://get.activepieces.com | sh -s -- --uninstall
#
# Creates ./activepieces with docker-compose.yml and .env, then starts the stack.
# Re-running install is safe: an existing .env is never overwritten, so your
# encryption key and data survive.

set -eu

# Only used if GitHub cannot be reached. The real version is resolved at runtime,
# so this does not need bumping every release.
AP_FALLBACK_VERSION="0.88.3"
AP_RELEASES_URL="https://github.com/activepieces/activepieces/releases/latest"
DIR="activepieces"
PORT="8080"
VERSION=""
ACTION="install"
PURGE="no"

say() { printf '%s\n' "$1"; }
die() { printf 'Error: %s\n' "$1" >&2; exit 1; }

usage() {
    cat <<'EOF'
Usage: install.sh [options]

  --upgrade         Upgrade an existing install to a newer version
  --uninstall       Stop and remove the containers (keeps your data)
  --purge           With --uninstall, also delete the database and all data
  --port <port>     Host port to serve on (default 8080)
  --version <tag>   Image version to install (default latest known)
  --dir <path>      Directory to install into (default ./activepieces)
  --help            Show this message
EOF
}

parse_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --upgrade)   ACTION="upgrade" ;;
            --uninstall) ACTION="uninstall" ;;
            --purge)     PURGE="yes" ;;
            --port)      shift; [ $# -gt 0 ] || die "--port needs a value"; PORT="$1" ;;
            --version)   shift; [ $# -gt 0 ] || die "--version needs a value"; VERSION="$1" ;;
            --dir)       shift; [ $# -gt 0 ] || die "--dir needs a value"; DIR="$1" ;;
            --help|-h)   usage; exit 0 ;;
            *)           die "Unknown option: $1 (try --help)" ;;
        esac
        shift
    done
}

# Docker Compose v1 (the hyphenated docker-compose) cannot read this file's syntax,
# so check for v2 specifically rather than for any docker at all.
check_docker() {
    command -v docker >/dev/null 2>&1 || die "Docker is not installed. See https://docs.docker.com/get-docker/"
    docker info >/dev/null 2>&1 || die "Docker is installed but not running. Start Docker and try again."
    docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required. See https://docs.docker.com/compose/install/"
}

# Different systems ship different tools, so try each in turn. If none is
# available we skip the check rather than guess: Compose still fails with its own
# bind error, which is worse UX but never a false positive.
port_in_use() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1 && return 0
        return 1
    fi
    if command -v ss >/dev/null 2>&1; then
        ss -ltn 2>/dev/null | grep -q "[:.]$1[[:space:]]" && return 0
        return 1
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -an 2>/dev/null | grep -i listen | grep -q "[:.]$1[[:space:]]" && return 0
        return 1
    fi
    return 1
}

# openssl is not present on every minimal image, so fall back to /dev/urandom.
# $1 is the number of bytes; output is that many bytes as lowercase hex.
rand_hex() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$1"
    elif command -v od >/dev/null 2>&1; then
        od -An -tx1 -N"$1" /dev/urandom | tr -d ' \n'
    elif command -v hexdump >/dev/null 2>&1; then
        hexdump -n "$1" -e '/1 "%02x"' /dev/urandom
    else
        die "Need openssl, od, or hexdump to generate secrets."
    fi
}

# Resolve the newest release the way k3s does: follow GitHub's /releases/latest
# redirect and take the last path segment. No JSON parsing, no API rate limit,
# and no version constant to maintain in this file.
resolve_latest() {
    v=""
    if command -v curl >/dev/null 2>&1; then
        v=$(curl -w '%{url_effective}' -L -s -S -o /dev/null "$AP_RELEASES_URL" 2>/dev/null | sed -e 's|.*/||')
    elif command -v wget >/dev/null 2>&1; then
        v=$(wget -SqO /dev/null "$AP_RELEASES_URL" 2>&1 | grep -i 'location:' | tail -1 | sed -e 's|.*/||' | tr -d '\r')
    fi
    case "$v" in
        [0-9]*) printf '%s' "$v" ;;
        *)      printf '%s' "$AP_FALLBACK_VERSION" ;;
    esac
}

# The user reached this script somehow, but that may have been wget.
http_ok() {
    if command -v curl >/dev/null 2>&1; then
        curl -fsS -m 3 -o /dev/null "$1" 2>/dev/null
    elif command -v wget >/dev/null 2>&1; then
        wget -q -T 3 -O /dev/null "$1" 2>/dev/null
    else
        return 1
    fi
}

write_compose() {
    cat > "$DIR/docker-compose.yml" <<'COMPOSE'
services:
  app:
    image: ghcr.io/activepieces/activepieces:${AP_VERSION}
    restart: unless-stopped
    ports:
      - '${AP_HOST_PORT}:80'
    depends_on:
      - postgres
      - redis
    env_file: .env
    environment:
      - AP_CONTAINER_TYPE=APP
    volumes:
      - ./cache:/usr/src/app/cache
    networks:
      - activepieces
  worker:
    image: ghcr.io/activepieces/activepieces:${AP_VERSION}
    restart: unless-stopped
    depends_on:
      - app
    env_file: .env
    environment:
      - AP_CONTAINER_TYPE=WORKER
      # Workers reach the app over this URL from inside the Docker network.
      # It must NOT be the public/localhost URL, which resolves to the worker itself.
      - AP_FRONTEND_URL=http://app
    volumes:
      - ./cache:/usr/src/app/cache
    networks:
      - activepieces
  postgres:
    image: 'pgvector/pgvector:0.8.0-pg14'
    restart: unless-stopped
    env_file: .env
    environment:
      - 'POSTGRES_DB=${AP_POSTGRES_DATABASE}'
      - 'POSTGRES_PASSWORD=${AP_POSTGRES_PASSWORD}'
      - 'POSTGRES_USER=${AP_POSTGRES_USERNAME}'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - activepieces
  redis:
    image: 'redis:7.0.7'
    restart: unless-stopped
    volumes:
      - 'redis_data:/data'
    networks:
      - activepieces
volumes:
  postgres_data:
  redis_data:
networks:
  activepieces:
COMPOSE
}

write_env() {
    cat > "$DIR/.env" <<EOF
AP_VERSION=$VERSION
# Host port only. Do NOT name this AP_PORT: that is the app's own listen port,
# and setting it here makes the container listen somewhere the mapping cannot reach.
AP_HOST_PORT=$PORT

# Enterprise edition with no licence key runs the free plan, with the same
# features as community. Add a licence key in the UI to unlock the rest,
# with no reinstall and no change to this file.
AP_EDITION=ee
AP_ENVIRONMENT=prod

# Required on ee. UNSANDBOXED is rejected at startup and the app will not boot.
AP_EXECUTION_MODE=SANDBOX_CODE_ONLY

AP_FRONTEND_URL=http://localhost:$PORT

AP_API_KEY=$(rand_hex 64)
AP_ENCRYPTION_KEY=$(rand_hex 16)
AP_JWT_SECRET=$(rand_hex 32)

AP_POSTGRES_HOST=postgres
AP_POSTGRES_PORT=5432
AP_POSTGRES_DATABASE=activepieces
AP_POSTGRES_USERNAME=postgres
AP_POSTGRES_PASSWORD=$(rand_hex 32)

AP_REDIS_HOST=redis
AP_REDIS_PORT=6379

AP_TELEMETRY_ENABLED=true
EOF
}

project_name() {
    basename "$DIR" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g; s/-*$//'
}

compose() {
    docker compose --project-directory "$DIR" -p "$(project_name)" "$@"
}

# Compose adopts any existing containers that share a project name, which would
# recreate and rename a stack this installer did not create. Refuse to do that.
assert_project_free() {
    existing=$(docker ps -a --filter "label=com.docker.compose.project=$(project_name)" --format '{{.Names}}' 2>/dev/null | head -5)
    if [ -n "$existing" ]; then
        printf 'Error: a Docker Compose project named "%s" already exists:\n' "$(project_name)" >&2
        printf '%s\n' "$existing" >&2
        printf 'Re-run with --dir <other-directory> to install alongside it.\n' >&2
        exit 1
    fi
}

wait_for_health() {
    say "Waiting for Activepieces to start..."
    i=0
    while [ "$i" -lt 60 ]; do
        if http_ok "http://localhost:$PORT/api/v1/health"; then
            return 0
        fi
        i=$((i + 1))
        sleep 2
    done
    return 1
}

do_install() {
    check_docker

    if [ -f "$DIR/.env" ]; then
        say "Found an existing install in $DIR. Starting it instead."
        say "To move to a newer version, run with --upgrade."
    else
        assert_project_free
        if port_in_use "$PORT"; then
            die "Port $PORT is already in use. Re-run with --port <other-port>."
        fi
        mkdir -p "$DIR/cache"
        write_env
    fi

    write_compose
    compose pull
    compose up -d

    if wait_for_health; then
        say ""
        say "Activepieces is running at http://localhost:$PORT"
        say "Create your first account to get started. It becomes the platform admin."
        say ""
        say "Your secrets are in $DIR/.env. Back that file up."
        say "Without AP_ENCRYPTION_KEY, stored connections cannot be decrypted."
    else
        say ""
        say "Activepieces did not respond in time. Check the logs with:"
        say "  docker compose --project-directory $DIR -p $(project_name) logs -f app"
        exit 1
    fi
}

do_upgrade() {
    check_docker
    [ -f "$DIR/.env" ] || die "No install found in $DIR. Run without --upgrade to install."

    # The version lives in .env, so the compose file never has to change between
    # releases and any edits the user made to it are preserved.
    if grep -q '^AP_VERSION=' "$DIR/.env"; then
        tmp="$DIR/.env.tmp"
        grep -v '^AP_VERSION=' "$DIR/.env" > "$tmp"
        printf 'AP_VERSION=%s\n' "$VERSION" | cat - "$tmp" > "$DIR/.env"
        rm -f "$tmp"
    else
        printf 'AP_VERSION=%s\n' "$VERSION" >> "$DIR/.env"
    fi

    say "Upgrading to $VERSION..."
    compose pull
    compose up -d --remove-orphans

    if wait_for_health; then
        say "Activepieces is running at http://localhost:$PORT"
    else
        say "Activepieces did not respond after the upgrade. Check the logs."
        exit 1
    fi
}

do_uninstall() {
    check_docker
    [ -f "$DIR/docker-compose.yml" ] || die "No install found in $DIR."

    if [ "$PURGE" = "yes" ]; then
        say "Removing containers AND all data..."
        compose down -v
        say "Done. Your flows, runs, and connections have been deleted."
    else
        say "Stopping and removing containers. Your data is kept."
        compose down
        say "Done. Run --uninstall --purge to also delete the database."
    fi
}

# Everything runs from main, invoked on the very last line. If the download is
# truncated the shell never reaches this call, so a partial script is a no-op
# instead of executing half a command.
main() {
    parse_args "$@"
    if [ -z "$VERSION" ]; then
        VERSION=$(resolve_latest)
    fi
    case "$ACTION" in
        install)   do_install ;;
        upgrade)   do_upgrade ;;
        uninstall) do_uninstall ;;
    esac
}

main "$@"
