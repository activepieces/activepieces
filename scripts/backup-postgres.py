#!/usr/bin/env python3
"""Synkra Flow — daily Postgres backup to Z1 S3 via boto3."""
import gzip
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

import boto3

ENV_FILE = "/root/synkra-flow/.env"

def read_env(path, key):
    with open(path) as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def main():
    endpoint = read_env(ENV_FILE, "AP_S3_ENDPOINT")
    bucket = read_env(ENV_FILE, "AP_S3_BUCKET")
    key_id = read_env(ENV_FILE, "AP_S3_ACCESS_KEY_ID")
    secret = read_env(ENV_FILE, "AP_S3_SECRET_ACCESS_KEY")

    if not all([endpoint, bucket, key_id, secret]):
        print("[ERROR] Missing S3 env vars", file=sys.stderr)
        return 1

    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    work = Path("/tmp/synkra-backups")
    work.mkdir(exist_ok=True)
    dump_name = f"synkra-flow-db-{ts}.sql.gz"
    dump_path = work / dump_name

    print(f"[{datetime.utcnow().isoformat()}Z] Dumping DB...")
    with open(dump_path, "wb") as f:
        p = subprocess.Popen(
            ["docker", "exec", "synkra-flow-postgres", "pg_dump",
             "-U", "postgres", "-d", "activepieces"],
            stdout=subprocess.PIPE,
        )
        gz = gzip.GzipFile(fileobj=f, mode="wb", compresslevel=9)
        while True:
            chunk = p.stdout.read(65536)
            if not chunk:
                break
            gz.write(chunk)
        gz.close()
        p.wait()

    size_mb = dump_path.stat().st_size / (1024 * 1024)
    print(f"[{datetime.utcnow().isoformat()}Z] Dump: {dump_name} ({size_mb:.1f} MB)")

    print(f"[{datetime.utcnow().isoformat()}Z] Uploading to S3...")
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=key_id,
        aws_secret_access_key=secret,
        region_name="us-east-1",
        config=boto3.session.Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )

    s3_key = f"db-backups/{dump_name}"
    s3.upload_file(str(dump_path), bucket, s3_key)
    print(f"[{datetime.utcnow().isoformat()}Z] ✓ Uploaded s3://{bucket}/{s3_key}")

    # prune >30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    print(f"[{datetime.utcnow().isoformat()}Z] Pruning >30d...")
    resp = s3.list_objects_v2(Bucket=bucket, Prefix="db-backups/")
    to_delete = []
    for obj in resp.get("Contents", []):
        if obj["LastModified"].replace(tzinfo=None) < cutoff:
            to_delete.append({"Key": obj["Key"]})
    if to_delete:
        s3.delete_objects(Bucket=bucket, Delete={"Objects": to_delete})
        print(f"  deleted {len(to_delete)} old backups")

    dump_path.unlink()
    print(f"[{datetime.utcnow().isoformat()}Z] Backup complete ✓")
    return 0

if __name__ == "__main__":
    sys.exit(main())
