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
  # For app nodes: prefer the private network default route (via NAT gateway) over the
  # public interface. All outbound traffic exits through the single NAT floating IP,
  # so only that one IP needs to be whitelisted in external services (e.g. DigitalOcean).
  - |
    %{ if use_nat_egress }
    cat > /etc/netplan/61-nat-egress.yaml <<NETPLAN
    network:
      version: 2
      renderer: networkd
      ethernets:
        eth0:
          dhcp4-overrides:
            route-metric: 200
        enp7s0:
          dhcp4: true
          dhcp4-overrides:
            route-metric: 100
          routes:
            - to: 0.0.0.0/0
              via: 10.0.0.1
              metric: 100
    NETPLAN
    chmod 600 /etc/netplan/61-nat-egress.yaml
    netplan apply
    %{ endif }
  # Wait for control plane to be ready before joining
  - sleep 60
  # Install k3s as an agent (worker) node and join the cluster
  - |
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.30.5+k3s1" sh -s - agent \
      --token="${k3s_token}" \
      --server="https://${control_plane_ip}:6443" \
      --node-ip="${node_ip}" \
      --node-label="${node_label}" \
      --flannel-iface=enp7s0
