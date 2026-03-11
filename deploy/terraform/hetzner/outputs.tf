output "load_balancer_ip" {
  description = "Public IP of the load balancer — point DNS here"
  value       = hcloud_load_balancer.main.ipv4
}

output "control_plane_ip" {
  description = "Public IP of the k3s control plane"
  value       = hcloud_server.control_plane.ipv4_address
}

output "nat_gateway_ip" {
  description = "Single egress IP for all app nodes — whitelist this one IP in external services (e.g. DigitalOcean managed DB/Redis trusted sources)"
  value       = hcloud_floating_ip.nat_gateway.ip_address
}

output "worker_node_ips" {
  description = "Public IPs of WORKER nodes"
  value       = hcloud_server.worker_nodes[*].ipv4_address
}

output "worker_floating_ips" {
  description = "Floating IPs assigned to WORKER nodes (used for outbound traffic)"
  value       = hcloud_floating_ip.worker[*].ip_address
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

output "tunnel_command" {
  description = "SSH tunnel: forwards localhost:6443 → control-plane:6443 so kubectl works without exposing the API publicly"
  value       = "ssh -N -L 6443:127.0.0.1:6443 root@${hcloud_server.control_plane.ipv4_address}"
}

