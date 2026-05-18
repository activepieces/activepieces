# Update Activepieces Docker Instances
echo "Updating Activepieces..."
git pull
docker compose pull
docker compose up -d --remove-orphans
echo "Successfully updated Activepieces."