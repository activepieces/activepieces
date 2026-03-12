#!/usr/bin/env bash
set -euo pipefail

# apply-secrets.sh — Read a .env file and upsert Kubernetes secrets.
#
# Without --secret-name: applies ALL secret groups defined in values.yaml,
# filtering the env file to each group's declared variables. Requires yq.
#
# With --secret-name: applies only that one secret using all vars in the env file.
#
# Usage:
#   ./deploy/scripts/apply-secrets.sh --env-file FILE [--namespace NS] [--dry-run] [--env stg|prod]
#   ./deploy/scripts/apply-secrets.sh --env-file FILE --secret-name NAME [--namespace NS] [--dry-run] [--env stg|prod]
#
# When a value contains a $(cat <path>) command substitution (e.g. AP_POSTGRES_SSL_CA),
# the script SSHes to root@49.13.51.126 and reads the file from /root/mrsk/<env>/<path>.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALUES_FILE="${SCRIPT_DIR}/../activepieces-helm/values.yaml"

ENV_FILE=".env.local"
NAMESPACE="activepieces"
DRY_RUN=false
DEPLOY_ENV=""
DEVOPS_HOST="root@49.13.51.126"
SECRET_NAME=""   # empty = apply all groups

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)    ENV_FILE="$2"; shift 2 ;;
    --namespace)   NAMESPACE="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --env)         DEPLOY_ENV="$2"; shift 2 ;;
    --secret-name) SECRET_NAME="$2"; shift 2 ;;
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
  local cat_pattern='^\$\(cat[[:space:]]+([^)]+)\)$'
  if [[ "$value" =~ $cat_pattern ]]; then
    # In dry-run mode, skip the SSH fetch and echo the raw substitution as a placeholder.
    if "$DRY_RUN"; then
      printf '%s' "$value"
      return 0
    fi
    local file_path="${BASH_REMATCH[1]}"
    if [[ -z "$DEPLOY_ENV" ]]; then
      echo "Error: value uses \$(cat ...) substitution but --env (stg|prod) was not specified." >&2
      exit 1
    fi
    local remote_path="k8n/${DEPLOY_ENV}/${file_path}"
    ssh -n -o BatchMode=yes "$DEVOPS_HOST" "cat ${remote_path}"
    return $?
  fi
  printf '%s' "$value"
}

# ---------------------------------------------------------------------------
# Build kubectl --from-literal/--from-file args from the env file.
# $1: newline-separated list of allowed var names, or "*" to include all.
# Outputs args to the `kubectl_args` array and temp paths to `tmp_files`.
# ---------------------------------------------------------------------------
build_kubectl_args() {
  local allowed="$1"
  kubectl_args=()
  tmp_files=()

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    key="${line%%=*}"
    raw_value="${line#*=}"

    # Skip vars not in the allowed list (unless all)
    if [[ "$allowed" != "*" ]]; then
      printf '%s\n' "$allowed" | grep -qxF "$key" || continue
    fi

    # Strip surrounding single or double quotes
    if [[ "$raw_value" =~ ^\'(.*)\'$ ]]; then
      raw_value="${BASH_REMATCH[1]}"
    elif [[ "$raw_value" =~ ^\"(.*)\"$ ]]; then
      raw_value="${BASH_REMATCH[1]}"
    fi

    local value
    value="$(resolve_value "$raw_value")"

    # Multiline values (e.g. PEM certs) must use --from-file via a temp file
    if [[ "$value" == *$'\n'* ]]; then
      local tmp
      tmp=$(mktemp)
      tmp_files+=("$tmp")
      printf '%s' "$value" > "$tmp"
      kubectl_args+=("--from-file=${key}=${tmp}")
    else
      kubectl_args+=("--from-literal=${key}=${value}")
    fi
  done < "$ENV_FILE"
}

# ---------------------------------------------------------------------------
# Apply a single secret by name, using pre-built kubectl_args.
# ---------------------------------------------------------------------------
apply_secret() {
  local name="$1"

  if [[ ${#kubectl_args[@]} -eq 0 ]]; then
    echo "  (no matching variables found — skipping $name)"
    return
  fi

  if "$DRY_RUN"; then
    echo "=== [DRY RUN] Would apply secret: $name ==="
    printf 'kubectl create secret generic %s \\\n' "$name"
    for arg in "${kubectl_args[@]}"; do
      printf '  %s \\\n' "$arg"
    done
    printf '  -n %s --dry-run=client -o yaml | kubectl apply -f -\n' "$NAMESPACE"
  else
    echo "Applying secret: $name (${#kubectl_args[@]} keys) ..."
    kubectl create secret generic "$name" \
      "${kubectl_args[@]}" \
      -n "$NAMESPACE" \
      --dry-run=client -o yaml \
      | kubectl apply -f -
  fi

  # Clean up temp files for this batch
  for tmp in "${tmp_files[@]+"${tmp_files[@]}"}"; do
    rm -f "$tmp"
  done
}

# ---------------------------------------------------------------------------
# Main: single secret or all groups
# ---------------------------------------------------------------------------
if [[ -n "$SECRET_NAME" ]]; then
  # Single secret — filter vars from values.yaml if the group is defined there,
  # otherwise include all vars from the env file (custom/ad-hoc secrets).
  if [[ -f "$VALUES_FILE" ]] && command -v yq &>/dev/null; then
    allowed_vars="$(yq ".activepiecesEnvVariables[\"$SECRET_NAME\"] // [] | .[]" "$VALUES_FILE")"
  else
    allowed_vars=""
  fi

  if [[ -n "$allowed_vars" ]]; then
    build_kubectl_args "$allowed_vars"
  else
    build_kubectl_args "*"
  fi

  apply_secret "$SECRET_NAME"
  echo ""
  echo "=== Summary ==="
  if "$DRY_RUN"; then
    echo "Would apply: $SECRET_NAME (${#kubectl_args[@]} keys)"
  else
    echo "Applied: $SECRET_NAME (${#kubectl_args[@]} keys)"
  fi
else
  # Apply all groups — read secret names and their var lists from values.yaml
  if ! command -v yq &>/dev/null; then
    echo "Error: yq is required to apply all secret groups. Install yq or pass --secret-name." >&2
    exit 1
  fi
  if [[ ! -f "$VALUES_FILE" ]]; then
    echo "Error: values.yaml not found at '$VALUES_FILE'." >&2
    exit 1
  fi

  echo "Applying all secret groups from $VALUES_FILE ..."
  echo ""

  total_applied=0
  secret_names=()
  while IFS= read -r sname; do
    secret_names+=("$sname")
  done < <(yq '.activepiecesEnvVariables | keys | .[]' "$VALUES_FILE")

  for sname in "${secret_names[@]}"; do
    allowed_vars="$(yq ".activepiecesEnvVariables[\"$sname\"][]" "$VALUES_FILE")"
    build_kubectl_args "$allowed_vars"
    apply_secret "$sname"
    total_applied=$(( total_applied + ${#kubectl_args[@]} ))
  done

  echo ""
  echo "=== Summary ==="
  if "$DRY_RUN"; then
    echo "Would apply: ${#secret_names[@]} secrets, $total_applied total keys"
  else
    echo "Applied: ${#secret_names[@]} secrets, $total_applied total keys"
  fi
fi
