cp .env.example .env
echo "AP_POSTGRES_PASSWORD=\"`openssl rand -base64 64`\"" >> .env
echo "AP_JWT_SECRET=\"`openssl rand -base64 64`\"" >> .env
