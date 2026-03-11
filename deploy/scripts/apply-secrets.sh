#!/usr/bin/env bash
set -euo pipefail

# apply-secrets.sh — Read a .env file and upsert Kubernetes secrets.
#
# Usage:
#   ./deploy/scripts/apply-secrets.sh [--env-file FILE] [--namespace NS] [--dry-run]

ENV_FILE=".env.local"
NAMESPACE="activepieces"
DRY_RUN=false

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)   ENV_FILE="$2"; shift 2 ;;
    --namespace)  NAMESPACE="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file '$ENV_FILE' not found." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Helper: look up a variable's value from the env file.
# Prints the value (possibly empty) and returns 0 if the key exists, 1 if not.
# ---------------------------------------------------------------------------
get_env_value() {
  local target_key="$1"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    local key="${line%%=*}"
    if [[ "$key" == "$target_key" ]]; then
      local value="${line#*=}"
      # Strip surrounding single or double quotes
      if [[ "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
      elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
        value="${BASH_REMATCH[1]}"
      fi
      printf '%s' "$value"
      return 0
    fi
  done < "$ENV_FILE"
  return 1
}

# ---------------------------------------------------------------------------
# Secret definitions: "SECRET_NAME KEY ENV_VAR"
# Entries with the same SECRET_NAME are grouped together.
# ---------------------------------------------------------------------------
SECRET_DEFS=(
  "activepieces-db-secret      host               AP_POSTGRES_HOST"
  "activepieces-db-secret      port               AP_POSTGRES_PORT"
  "activepieces-db-secret      password           AP_POSTGRES_PASSWORD"
  "activepieces-db-ssl-ca      ssl-ca             AP_POSTGRES_SSL_CA"
  "activepieces-redis-secret   host               AP_REDIS_HOST"
  "activepieces-redis-secret   port               AP_REDIS_PORT"
  "activepieces-redis-secret   password           AP_REDIS_PASSWORD"
  "activepieces-s3-secret      accessKeyId        AP_S3_ACCESS_KEY_ID"
  "activepieces-s3-secret      secretAccessKey    AP_S3_SECRET_ACCESS_KEY"
  "activepieces-smtp-secret    username           AP_SMTP_USERNAME"
  "activepieces-smtp-secret    password           AP_SMTP_PASSWORD"
  "activepieces-stripe-secret  secretKey          AP_STRIPE_SECRET_KEY"
  "activepieces-stripe-secret  webhookSecret      AP_STRIPE_WEBHOOK_SECRET"
  "activepieces-api-key        api-key            AP_API_KEY"
  "activepieces-worker-token   worker-token       AP_WORKER_TOKEN"
  "activepieces-secrets        encryption-key     AP_ENCRYPTION_KEY"
  "activepieces-jwt-secret     jwt-secret         AP_JWT_SECRET"
)

# Derive ordered unique list of secret names
SECRET_NAMES=()
for def in "${SECRET_DEFS[@]}"; do
  name="${def%%[[:space:]]*}"
  # Add to list only if not already present
  found=false
  for existing in "${SECRET_NAMES[@]+"${SECRET_NAMES[@]}"}"; do
    [[ "$existing" == "$name" ]] && found=true && break
  done
  "$found" || SECRET_NAMES+=("$name")
done

# ---------------------------------------------------------------------------
# Apply (or preview) each secret
# ---------------------------------------------------------------------------
applied=()
skipped=()

for secret_name in "${SECRET_NAMES[@]}"; do
  # Collect --from-literal args for every key whose env var is present
  literal_args=()
  for def in "${SECRET_DEFS[@]}"; do
    read -r sname key env_var <<< "$def"
    [[ "$sname" != "$secret_name" ]] && continue
    value="$(get_env_value "$env_var")" || continue
    literal_args+=("--from-literal=${key}=${value}")
  done

  if [[ ${#literal_args[@]} -eq 0 ]]; then
    skipped+=("$secret_name")
    continue
  fi

  if "$DRY_RUN"; then
    echo "=== [DRY RUN] Would apply secret: $secret_name ==="
    printf 'kubectl create secret generic %s \\\n' "$secret_name"
    for arg in "${literal_args[@]}"; do
      printf '  %s \\\n' "$arg"
    done
    printf '  -n %s --dry-run=client -o yaml | kubectl apply -f -\n\n' "$NAMESPACE"
  else
    echo "Applying secret: $secret_name ..."
    kubectl create secret generic "$secret_name" \
      "${literal_args[@]}" \
      -n "$NAMESPACE" \
      --dry-run=client -o yaml \
      | kubectl apply -f -
  fi

  applied+=("$secret_name")
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Summary ==="
if [[ ${#applied[@]} -gt 0 ]]; then
  if "$DRY_RUN"; then
    echo "Would apply (${#applied[@]}):"
  else
    echo "Applied (${#applied[@]}):"
  fi
  for s in "${applied[@]}"; do echo "  + $s"; done
fi

if [[ ${#skipped[@]} -gt 0 ]]; then
  echo "Skipped — no vars present (${#skipped[@]}):"
  for s in "${skipped[@]}"; do echo "  - $s"; done
fi
