# Backup — PARKED 9 Oct 2026

Both rclone and boto3 hang on upload to Z1 S3. AP's own client works (file uploads
function), so Z1 is reachable. The issue is specific to rclone/boto3 HTTP client
+ Z1 TLS negotiation.

## Next steps to try
1. Test with `curl -X PUT` directly to see if HTTP PUT itself works
2. Try rclone with `--s3-no-head --s3-disable-checksum` AND `--low-level-retries 1`
3. Try AWS Signature V2 (`RCLONE_CONFIG_ZY_SIGNATURE_VERSION=v2`) — old Z1
4. Try plain HTTP (no TLS) `http://s3.z1storage.com`
5. Try Python with `requests` + manual SigV4 (skip SDK overhead)

## Until fixed
- No automated backup running
- Manual backup: `docker exec synkra-flow-postgres pg_dump -U postgres -d activepieces | gzip > backup.sql.gz`
- Cron entry exists but script fails silently
