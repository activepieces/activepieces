echo "Branch: $1"
rm -rf /etc/nginx/sites-enabled/$1
cat << EOT >> /etc/nginx/sites-enabled/$1
server {
    listen 80;
    listen [::]:80;
    server_name $1.activepieces.xyz;
    return 302 https://\$server_name\$request_uri;
}

server {
   listen 443 ssl http2;
   listen [::]:443 ssl http2;
   ssl_certificate         /etc/ssl/cert.pem;
   ssl_certificate_key     /etc/ssl/key.pem;
   server_name $1.activepieces.xyz;

  root /home/admin/reviews/$1;
  index index.html;

  location / {
    try_files \$uri\$args \$uri\$args/ /index.html;
  }

}
EOT
rm -rf /home/admin/reviews/$1
mkdir -p /home/admin/reviews/$1
