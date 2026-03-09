#cloud-config
package_update: true
packages:
  - redis-server

write_files:
  - path: /etc/redis/redis.conf
    content: |
      bind 0.0.0.0
      protected-mode yes
      port 6379
      requirepass ${redis_password}
      maxmemory 512mb
      maxmemory-policy allkeys-lru
      appendonly yes
      appendfilename "appendonly.aof"
      dir /var/lib/redis

runcmd:
  - systemctl enable redis-server
  - systemctl restart redis-server
