terraform {
  required_version = ">= 1.5"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# ============================================================================
# SSH Key — upload your public key so Terraform/you can SSH into nodes
# ============================================================================

resource "hcloud_ssh_key" "default" {
  name       = "${var.cluster_name}-key"
  public_key = var.ssh_public_key
}

# ============================================================================
# Private Network — all nodes talk to each other on this internal network
# ============================================================================

resource "hcloud_network" "main" {
  name     = "${var.cluster_name}-network"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "main" {
  network_id   = hcloud_network.main.id
  type         = "cloud"
  network_zone = var.network_zone   # e.g. "eu-central"
  ip_range     = "10.0.1.0/24"
}

# ============================================================================
# Firewall
# ============================================================================

resource "hcloud_firewall" "main" {
  name = "${var.cluster_name}-firewall"

  # Allow SSH from anywhere (restrict to your IP in production)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTP (nginx-ingress, Let's Encrypt challenge)
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Kubernetes API server (control plane)
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "6443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Allow all traffic within private network (nodes talk to each other)
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "any"
    source_ips = ["10.0.0.0/16"]
  }
  rule {
    direction  = "in"
    protocol   = "udp"
    port       = "any"
    source_ips = ["10.0.0.0/16"]
  }
}

# ============================================================================
# k3s Control Plane
# One VM that runs the Kubernetes control plane (API server, scheduler, etc.)
# Also runs app pods since it's small and we want to use resources efficiently.
# ============================================================================

resource "hcloud_server" "control_plane" {
  name        = "${var.cluster_name}-control-plane"
  server_type = var.control_plane_server_type   # e.g. cx22
  image       = "ubuntu-24.04"
  location    = var.location                    # e.g. "nbg1"
  ssh_keys    = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.1"
  }

  # cloud-init: installs k3s server on first boot
  user_data = templatefile("${path.module}/cloud-init-control-plane.yaml.tpl", {
    k3s_token = random_string.k3s_token.result
    node_ip   = "10.0.1.1"
  })

  depends_on = [hcloud_network_subnet.main]
}

# ============================================================================
# App Nodes — run the Activepieces APP pods (API + UI)
# ============================================================================

resource "hcloud_server" "app_nodes" {
  count       = var.app_node_count
  name        = "${var.cluster_name}-app-${count.index + 1}"
  server_type = var.app_server_type   # e.g. cx22
  image       = "ubuntu-24.04"
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.${count.index + 10}"
  }

  user_data = templatefile("${path.module}/cloud-init-agent.yaml.tpl", {
    k3s_token          = random_string.k3s_token.result
    control_plane_ip   = "10.0.1.1"
    node_label         = "role=app"
  })

  depends_on = [hcloud_server.control_plane]
}

# ============================================================================
# Worker Nodes — run the Activepieces WORKER pods (flow execution)
# ============================================================================

resource "hcloud_server" "worker_nodes" {
  count       = var.worker_node_count
  name        = "${var.cluster_name}-worker-${count.index + 1}"
  server_type = var.worker_server_type   # e.g. cx32 (more CPU for flow execution)
  image       = "ubuntu-24.04"
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.${count.index + 20}"
  }

  user_data = templatefile("${path.module}/cloud-init-agent.yaml.tpl", {
    k3s_token          = random_string.k3s_token.result
    control_plane_ip   = "10.0.1.1"
    node_label         = "role=worker"
  })

  depends_on = [hcloud_server.control_plane]
}

# ============================================================================
# Redis VM — a small dedicated VM running Redis
# Hetzner doesn't offer managed Redis, so we run it ourselves
# ============================================================================

resource "hcloud_server" "redis" {
  name        = "${var.cluster_name}-redis"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.5"
  }

  user_data = templatefile("${path.module}/cloud-init-redis.yaml.tpl", {
    redis_password = random_password.redis.result
  })

  depends_on = [hcloud_network_subnet.main]
}

# ============================================================================
# PostgreSQL VM
# The hcloud Terraform provider does not support managed databases yet.
# We run PostgreSQL on a dedicated VM instead.
# ============================================================================

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "hcloud_server" "postgres" {
  name         = "${var.cluster_name}-postgres"
  server_type  = var.db_server_type
  image        = "ubuntu-24.04"
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]

  network {
    network_id = hcloud_network.main.id
    ip         = "10.0.1.4"
  }

  user_data = templatefile("${path.module}/cloud-init-postgres.yaml.tpl", {
    postgres_password = random_password.postgres.result
  })

  depends_on = [hcloud_network_subnet.main]
}

# ============================================================================
# Object Storage
# The hcloud Terraform provider does not support Object Storage buckets yet.
# Create the bucket manually:
#   1. Go to cloud.hetzner.com → Object Storage → Create bucket
#   2. Name it: var.s3_bucket_name (e.g. "activepiecesstagingbucket")
#   3. Go to Security → S3 Credentials → Generate credentials
#   4. Use those credentials in the kubectl create secret command (see outputs)
# ============================================================================

# ============================================================================
# Random secrets
# ============================================================================

resource "random_string" "k3s_token" {
  length  = 48
  special = false
}

resource "random_password" "redis" {
  length  = 32
  special = false
}
