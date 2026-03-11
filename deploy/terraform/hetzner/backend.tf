# ============================================================================
# Remote State Backend — Hetzner Object Storage (S3-compatible)
#
# Credentials are read from environment variables (do NOT hardcode here):
#   export AWS_ACCESS_KEY_ID=<hetzner-s3-access-key>
#   export AWS_SECRET_ACCESS_KEY=<hetzner-s3-secret-key>
#
# Workspaces isolate state per environment:
#   terraform workspace new prod
#   terraform workspace new stg
#
# State is stored at:
#   env:/prod/hetzner/terraform.tfstate
#   env:/stg/hetzner/terraform.tfstate
# ============================================================================

terraform {
  backend "s3" {
    bucket = "activepiecesstagingbucket"

    key    = "hetzner/terraform.tfstate"
    region = "eu-central-1"   # required by S3 protocol but ignored by Hetzner

    endpoint = "https://fsn1.your-objectstorage.com"

    # Hetzner Object Storage doesn't support these AWS-specific checks
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true

    force_path_style = true
  }
}
