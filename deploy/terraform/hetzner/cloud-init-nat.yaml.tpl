#cloud-config

# NAT Gateway — no heavy packages needed, everything is built into Ubuntu 24.04.
# Sets up the floating IP on eth0 and uses nftables to SNAT all private-network
# egress traffic through that floating IP.

runcmd:
  # Add the floating IP as a secondary address on the public interface
  - |
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

  # Enable IPv4 forwarding (persist across reboots)
  - sysctl -w net.ipv4.ip_forward=1
  - sed -i 's/^#*net.ipv4.ip_forward.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf

  # SNAT: all traffic from the private network (10.0.0.0/16) leaving via eth0
  # will appear to come from the stable floating IP, not the ephemeral primary IP.
  - |
    nft add table ip nat
    nft add chain ip nat postrouting '{ type nat hook postrouting priority 100; }'
    nft add rule ip nat postrouting ip saddr 10.0.0.0/16 oif eth0 snat to ${floating_ip}

  # Persist nftables rules so they survive reboots
  - nft list ruleset > /etc/nftables.conf
  - systemctl enable --now nftables
