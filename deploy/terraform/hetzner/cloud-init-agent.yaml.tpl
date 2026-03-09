#cloud-config
package_update: true
packages:
  - curl

runcmd:
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
