variable "hcloud_token" {
  description = "Hetzner Cloud API token (generate at: cloud.hetzner.com → project → Security → API Tokens)"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Your SSH public key (contents of ~/.ssh/id_rsa.pub or ~/.ssh/id_ed25519.pub)"
  type        = string
}

variable "cluster_name" {
  description = "Prefix for all resource names"
  type        = string
  default     = "activepieces-prod"
}

variable "location" {
  description = "Hetzner datacenter location (nbg1=Nuremberg, fsn1=Falkenstein, hel1=Helsinki, ash=Ashburn US)"
  type        = string
  default     = "nbg1"
}

variable "network_zone" {
  description = "Network zone matching location (eu-central for nbg1/fsn1/hel1, us-east for ash)"
  type        = string
  default     = "eu-central"
}

variable "object_storage_location" {
  description = "Object storage location (fsn1 or nbg1)"
  type        = string
  default     = "fsn1"
}

# Server types (see: hcloud server-type list)
variable "control_plane_server_type" {
  description = "Server type for k3s control plane"
  type        = string
  default     = "cx23"   # 2 vCPU, 4GB RAM — ~€4.15/mo
}

variable "app_server_type" {
  description = "Server type for APP nodes"
  type        = string
  default     = "cx33"   # 2 vCPU, 4GB RAM — ~€4.15/mo
}

variable "app_node_count" {
  description = "Number of APP nodes"
  type        = number
  default     = 2
}

variable "worker_server_type" {
  description = "Server type for WORKER nodes (more CPU for flow execution)"
  type        = string
  default     = "cx43"   # 4 vCPU, 8GB RAM — ~€8.50/mo
}

variable "worker_node_count" {
  description = "Number of WORKER nodes"
  type        = number
  default     = 4
}

variable "db_server_type" {
  description = "Server type for the PostgreSQL VM"
  type        = string
  default     = "cx23"   # 2 vCPU, 4GB RAM
}

variable "s3_bucket_name" {
  description = "Name for the Hetzner Object Storage bucket (must be globally unique)"
  type        = string
}

variable "load_balancer_type" {
  description = "Hetzner load balancer type (lb11=5 targets ~€5/mo, lb21=25 targets ~€20/mo)"
  type        = string
  default     = "lb11"
}
