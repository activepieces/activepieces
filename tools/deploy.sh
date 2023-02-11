cp .env.example .env
echo "\nAP_POSTGRES_PASSWORD=\"`openssl rand -hex 32`\"" >> .env
echo "\nAP_JWT_SECRET=\"`openssl rand -hex 32`\"" >> .env
