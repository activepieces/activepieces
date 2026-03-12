#!/usr/bin/env bash
set -euo pipefail

# apply-secrets.sh — Read a .env file and upsert the single "activepieces-secrets" Kubernetes secret.
#
# All AP_* and OTEL_* variables from the env file are written as keys into one secret:
#   activepieces-secrets
#
# Usage:
#   ./deploy/scripts/apply-secrets.sh [--env-file FILE] [--namespace NS] [--dry-run] [--env stg|prod]
#
# When a value contains a $(cat <path>) command substitution (e.g. AP_POSTGRES_SSL_CA),
# the script SSHes to root@49.13.51.126 and reads the file from /root/mrsk/<env>/<path>.

ENV_FILE=".env.local"
NAMESPACE="activepieces"
DRY_RUN=false
DEPLOY_ENV=""
DEVOPS_HOST="root@49.13.51.126"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)   ENV_FILE="$2"; shift 2 ;;
    --namespace)  NAMESPACE="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --env)        DEPLOY_ENV="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file '$ENV_FILE' not found." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Helper: resolve a value that may be a $(cat <path>) command substitution.
# If the value matches that pattern, SSHes to the devops machine and reads
# the file from /root/mrsk/<DEPLOY_ENV>/<path>.
# ---------------------------------------------------------------------------
resolve_value() {
  local value="$1"
  # Match $( cat <path> ) with optional whitespace
  local cat_pattern='^\$\(cat[[:space:]]+([^)]+)\)$'
  if [[ "$value" =~ $cat_pattern ]]; then
    local file_path="${BASH_REMATCH[1]}"
    if [[ -z "$DEPLOY_ENV" ]]; then
      echo "Error: value uses \$(cat ...) substitution but --env (stg|prod) was not specified." >&2
      exit 1
    fi
    local remote_path="/root/mrsk/${DEPLOY_ENV}/${file_path}"
    ssh -n -o BatchMode=yes "$DEVOPS_HOST" "cat ${remote_path}"
    return $?
  fi
  printf '%s' "$value"
}

# ---------------------------------------------------------------------------
# Build kubectl args: one --from-literal (or --from-file for multiline) per var
# ---------------------------------------------------------------------------
kubectl_args=()
tmp_files=()

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  key="${line%%=*}"
  raw_value="${line#*=}"

  # Strip surrounding single or double quotes
  if [[ "$raw_value" =~ ^\'(.*)\'$ ]]; then
    raw_value="${BASH_REMATCH[1]}"
  elif [[ "$raw_value" =~ ^\"(.*)\"$ ]]; then
    raw_value="${BASH_REMATCH[1]}"
  fi

  value="$(resolve_value "$raw_value")"

  # Multiline values (e.g. PEM certs) must use --from-file via a temp file
  if [[ "$value" == *$'\n'* ]]; then
    tmp=$(mktemp)
    tmp_files+=("$tmp")
    printf '%s' "$value" > "$tmp"
    kubectl_args+=("--from-file=${key}=${tmp}")
  else
    kubectl_args+=("--from-literal=${key}=${value}")
  fi
done < "$ENV_FILE"

# ---------------------------------------------------------------------------
# Apply (or preview) the single secret
# ---------------------------------------------------------------------------
SECRET_NAME="activepieces-secrets"

if [[ ${#kubectl_args[@]} -eq 0 ]]; then
  echo "No variables found in '$ENV_FILE' — nothing to apply." >&2
  exit 1
fi

if "$DRY_RUN"; then
  echo "=== [DRY RUN] Would apply secret: $SECRET_NAME ==="
  printf 'kubectl create secret generic %s \\\n' "$SECRET_NAME"
  for arg in "${kubectl_args[@]}"; do
    printf '  %s \\\n' "$arg"
  done
  printf '  -n %s --dry-run=client -o yaml | kubectl apply -f -\n' "$NAMESPACE"
else
  echo "Applying secret: $SECRET_NAME ..."
  kubectl create secret generic "$SECRET_NAME" \
    "${kubectl_args[@]}" \
    -n "$NAMESPACE" \
    --dry-run=client -o yaml \
    | kubectl apply -f -
fi

# Clean up any temp files used for multiline values
for tmp in "${tmp_files[@]+"${tmp_files[@]}"}"; do
  rm -f "$tmp"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Summary ==="
if "$DRY_RUN"; then
  echo "Would apply: $SECRET_NAME (${#kubectl_args[@]} keys)"
else
  echo "Applied: $SECRET_NAME (${#kubectl_args[@]} keys)"
fi
