#!/bin/bash
# Synkra Flow — daily Postgres backup to Z1 S3 via rclone
# Cron: 0 2 * * * /root/synkra-flow/scripts/backup-postgres.sh >> /var/log/synkra-backup.log 2>&1
set -euo pipefail

ENV_FILE=/root/synkra-flow/.env
[ -f "$ENV_FILE" ] || { echo "[ERROR] $ENV_FILE not found"; exit 1; }

S3_KEY=$(grep -E '^AP_S3_ACCESS_KEY_ID='     "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
S3_SECRET=$(grep -E '^AP_S3_SECRET_ACCESS_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
S3_ENDPOINT=$(grep -E '^AP_S3_ENDPOINT='     "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
S3_BUCKET=$(grep -E '^AP_S3_BUCKET='         "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')

[ -n "${S3_KEY:-}" ] && [ -n "${S3_SECRET:-}" ] || { echo "[ERROR] S3 credentials missing"; exit 1; }
[ -n "${S3_ENDPOINT:-}" ] && [ -n "${S3_BUCKET:-}" ] || { echo "[ERROR] endpoint/bucket missing"; exit 1; }

# rclone config via env vars
export RCLONE_CONFIG_ZY_TYPE=s3
export RCLONE_CONFIG_ZY_PROVIDER=Other
export RCLONE_CONFIG_ZY_ACCESS_KEY_ID="$S3_KEY"
export RCLONE_CONFIG_ZY_SECRET_ACCESS_KEY="$S3_SECRET"
export RCLONE_CONFIG_ZY_ENDPOINT="$S3_ENDPOINT"
export RCLONE_CONFIG_ZY_REGION=us-east-1
export RCLONE_CONFIG_ZY_FORCE_PATH_STYLE=true
# Force single-part upload — Z1 does not accept multipart without Content-Length
S3_ARGS="--s3-upload-cutoff 5G --s3-chunk-size 100M --s3-disable-checksum --no-check-certificate"

TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
WORKDIR=/tmp/synkra-backups
FILE="synkra-flow-db-${TIMESTAMP}.sql.gz"
mkdir -p "$WORKDIR"

echo "[$(date -u +%FT%TZ)] Dumping DB..."
docker exec synkra-flow-postgres pg_dump -U postgres -d activepieces | gzip -9 > "${WORKDIR}/${FILE}"
SIZE=$(du -h "${WORKDIR}/${FILE}" | cut -f1)
echo "[$(date -u +%FT%TZ)] Dump complete: ${FILE} (${SIZE})"

echo "[$(date -u +%FT%TZ)] Uploading via rclone..."
rclone $S3_ARGS copy "${WORKDIR}/${FILE}" "zy:${S3_BUCKET}/db-backups/"

echo "[$(date -u +%FT%TZ)] Verifying upload..."
rclone $S3_ARGS ls "zy:${S3_BUCKET}/db-backups/" | grep -q "$FILE" \
  && echo "[$(date -u +%FT%TZ)] ✓ Verified on S3" \
  || { echo "[ERROR] Upload not found on S3"; exit 1; }

echo "[$(date -u +%FT%TZ)] Pruning backups >30d..."
rclone $S3_ARGS delete "zy:${S3_BUCKET}/db-backups/" --min-age 30d

rm -f "${WORKDIR}/${FILE}"
echo "[$(date -u +%FT%TZ)] Backup complete ✓"
