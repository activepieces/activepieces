#cloud-config
package_update: true
packages:
  - curl

runcmd:
  # Install Docker (required for sandboxed worker execution)
  - |
    %{ if node_label == "role=worker" }
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    %{ endif }
  # Configure floating IP on the network interface (if provided)
  - |
    %{ if floating_ip != "" }
    cat > /etc/netplan/60-floating-ip.yaml <<NETPLAN
    network:
      version: 2
      renderer: networkd
      ethernets:
        eth0:
          addresses:
          - ${floating_ip}/32
    NETPLAN
    chmod 600 /etc/netplan/60-floating-ip.yaml
    netplan apply
    %{ endif }
  # Wait for control plane to be ready before joining
  - sleep 60
  # Install k3s as an agent (worker) node and join the cluster
  - |
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.30.5+k3s1" sh -s - agent \
      --token="${k3s_token}" \
      --server="https://${control_plane_ip}:6443" \
      --node-ip="$(hostname -I | awk '{print $2}')" \
      --node-label="${node_label}" \
      --flannel-iface=enp7s0
