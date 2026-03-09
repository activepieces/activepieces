#cloud-config
package_update: true
packages:
  - curl
  - open-iscsi   # required for Longhorn volumes (if used later)

runcmd:
  # Install k3s as the control plane (server mode)
  # --disable traefik: we use nginx-ingress instead
  # --node-ip: advertise the private network IP
  - |
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.30.5+k3s1" sh -s - server \
      --token="${k3s_token}" \
      --node-ip="${node_ip}" \
      --advertise-address="${node_ip}" \
      --disable=traefik \
      --disable=servicelb \
      --flannel-iface=enp7s0 \
      --write-kubeconfig-mode=644
  # Wait for k3s to be ready
  - sleep 30
  - k3s kubectl get nodes
