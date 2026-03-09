output "control_plane_ip" {
  description = "Public IP of the k3s control plane — use this to get your kubeconfig"
  value       = hcloud_server.control_plane.ipv4_address
}

output "app_node_ips" {
  description = "Public IPs of APP nodes"
  value       = hcloud_server.app_nodes[*].ipv4_address
}

output "worker_node_ips" {
  description = "Public IPs of WORKER nodes"
  value       = hcloud_server.worker_nodes[*].ipv4_address
}

output "redis_private_ip" {
  description = "Private IP of the Redis VM (use this as redis.host in Helm values)"
  value       = "10.0.1.5"
}

output "postgres_private_ip" {
  description = "Private IP of the PostgreSQL VM (use as postgresql.host in Helm values)"
  value       = "10.0.1.4"
}

output "s3_bucket_name" {
  description = "Object Storage bucket name (create manually in Hetzner console)"
  value       = var.s3_bucket_name
}

output "s3_endpoint" {
  description = "S3-compatible endpoint (use in Helm values)"
  value       = "https://${var.object_storage_location}.your-objectstorage.com"
}

output "kubeconfig_command" {
  description = "Command to fetch kubeconfig from control plane"
  value       = "ssh root@${hcloud_server.control_plane.ipv4_address} cat /etc/rancher/k3s/k3s.yaml | sed 's/127.0.0.1/${hcloud_server.control_plane.ipv4_address}/g' > ~/.kube/config"
}

output "k8s_secrets_commands" {
  description = "kubectl commands to create secrets — run after fetching kubeconfig"
  sensitive   = true
  value       = <<-EOT
    kubectl create namespace activepieces

    kubectl create secret generic activepieces-db-secret \
      --from-literal=password='${random_password.postgres.result}' \
      -n activepieces

    kubectl create secret generic activepieces-redis-secret \
      --from-literal=password='${random_password.redis.result}' \
      -n activepieces

    # For S3: get Access Key ID and Secret from Hetzner Console
    # cloud.hetzner.com → Object Storage → Manage credentials
    kubectl create secret generic activepieces-s3-secret \
      --from-literal=accessKeyId='PASTE_FROM_HETZNER_CONSOLE' \
      --from-literal=secretAccessKey='PASTE_FROM_HETZNER_CONSOLE' \
      -n activepieces
  EOT
}
