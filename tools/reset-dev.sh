rm -rf ~/.activepieces
rm -rf node_modules/
docker container rm activepieces_devcontainer_db_1 --force
docker container rm activepieces_devcontainer_redis_1 --force
docker container rm activepieces_devcontainer_app_1 --force
docker volume rm activepieces_devcontainer_redis_data
docker volume rm activepieces_devcontainer_postgres_data

echo "Deleted activepieces dev dockers and volumes."