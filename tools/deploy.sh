cp .env.example .env
sed -i 's|AP_POSTGRES_PASSWORD=.*|AP_POSTGRES_PASSWORD='"$(openssl rand -hex 32)"'|g' .env
sed -i 's|AP_JWT_SECRET=.*|AP_JWT_SECRET='"$(openssl rand -hex 32)"'|g' .env
sed -i 's|ENCRYPTION_KEY=.*|ENCRYPTION_KEY='"$(openssl rand -hex 16)"'|g' .env

echo "A .env file containing random passwords and secrets has been successfully generated."
