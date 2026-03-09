#cloud-config
package_update: true
packages:
  - postgresql
  - postgresql-contrib

runcmd:
  # Set postgres user password
  - sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${postgres_password}';"
  # Create activepieces database
  - sudo -u postgres psql -c "CREATE DATABASE activepieces OWNER postgres;"
  # Allow connections from private network (10.0.0.0/16)
  - echo "host all all 10.0.0.0/16 md5" >> /etc/postgresql/16/main/pg_hba.conf
  # Listen on all interfaces (traffic restricted by firewall to private network only)
  - sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
  - systemctl restart postgresql
