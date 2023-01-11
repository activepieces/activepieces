#!/usr/bin/env bash

sudo apt-get update

sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

git clone https://github.com/activepieces/activepieces

docker compose -f ./activepieces/docker-compose.yml up -d

git clone https://github.com/digitalocean/marketplace-partners

ufw default allow outgoing
ufw default deny incoming
ufw allow ssh
ufw allow 8080/tcp
ufw enable

./marketplace-partners/scripts/90-cleanup.sh

sudo apt-get purge -y droplet-agent

./marketplace-partners/scripts/99-img-check.sh

history -c
