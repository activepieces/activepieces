rm -rf ~/.activepieces
docker compose down
docker volume rm activepieces_redis_data
docker volume rm activepieces_postgres_data
echo "Deleted activepieces dockers and volumes."