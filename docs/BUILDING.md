# Building and Deploying

## The environment

- Server: 167.86.106.152 (Contabo VPS)
- Repo: `/root/synkra-flow`
- Main branch: `main`
- GitHub: https://github.com/Capacitiq-group/synkra-flow

## Building the Docker image

From `/root/synkra-flow`:

```bash
docker build -t synkra-flow:latest -f Dockerfile . > /tmp/build.log 2>&1 &
Build takes 2 to 15 minutes depending on cache state. Watch progress with:

bash
tail -f /tmp/build.log
Check for errors after:

bash
grep -E "error TS|ERROR" /tmp/build.log | head -20
Backing up before a build
Always tag the current image so you can roll back:

bash
docker tag synkra-flow:latest synkra-flow:backup-$(date +%s)
Restarting the containers
After a successful build:

bash
cd /root/synkra-flow
docker compose -p synkraflow -f docker-compose.yml -f docker-compose.override.yml up -d --force-recreate app worker
The --force-recreate flag is important. Without it, Docker will not pick up
a new image tag.
Checking container health
bash
docker ps --filter name=synkra-flow --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
Expected: (healthy) for app and worker.

Following logs
bash
docker logs synkra-flow-app --tail 100 -f
docker logs synkra-flow-worker --tail 100 -f
Rolling back
If a build breaks the running app:

bash
# stop the broken version
docker compose -p synkraflow -f docker-compose.yml -f docker-compose.override.yml down

# retag an old image as latest
docker tag synkra-flow:backup-pre-v9 synkra-flow:latest

# bring it back up
docker compose -p synkraflow -f docker-compose.yml -f docker-compose.override.yml up -d
List backup tags:

bash
docker images | grep synkra-flow
Testing a piece build locally
Do not rebuild the whole image just to test a piece. Build only what you need:

bash
# build the piece's TypeScript
npx turbo run build --filter=@synkra/piece-synkra-chat --force

# bundle it (creates a self-contained .js)
npx tsx packages/cli/src/index.ts pieces bundle packages/pieces/community/synkra-chat

# pack it into a .tgz
cd packages/pieces/community/synkra-chat/dist && npm pack --json

# copy it into the api assets folder
cp synkra-piece-*.tgz /root/synkra-flow/packages/server/api/src/assets/synkra-pieces/
Local database access
bash
docker exec -it synkra-flow-postgres psql -U postgres -d activepieces
Local Redis access
bash
docker exec -it synkra-flow-redis redis-cli
Environment variables
All config lives in /root/synkra-flow/.env. Never commit it.

Current variables (see the file for values):
AP_JWT_SECRET
AP_ENCRYPTION_KEY
AP_API_KEY
AP_POSTGRES_PASSWORD
AP_HOST_PORT=8199
AP_FRONTEND_URL=https://flow.synkra.co.za
AP_WEBHOOK_URL=https://flow.synkra.co.za
AP_ENVIRONMENT=prod
AP_EDITION=ee
AP_FILE_STORAGE_LOCATION=S3
AP_S3_ENDPOINT
AP_S3_BUCKET
AP_S3_REGION
AP_S3_ACCESS_KEY_ID
AP_S3_SECRET_ACCESS_KEY
AP_S3_USE_SIGNED_URLS=true
Not yet set (add when ready):

text
SYNKRA_PAYSTACK_SECRET_KEY
SYNKRA_PAYSTACK_WEBHOOK_SECRET
SYNKRA_PAYSTACK_PLAN_STARTER
SYNKRA_PAYSTACK_PLAN_BUSINESS
SYNKRA_PAYSTACK_PLAN_PRO
AP_SMTP_HOST
AP_SMTP_PORT
AP_SMTP_USERNAME
AP_SMTP_PASSWORD
AP_SMTP_SENDER_EMAIL
AP_SMTP_SENDER_NAME
Rebuilding after env changes
Environment variables are read at boot. After changing .env:

bash
docker compose -p synkraflow -f docker-compose.yml -f docker-compose.override.yml up -d --force-recreate app worker
Traefik and domains
Traefik is managed by Coolify. It reads Docker labels on our app container.

Labels live in docker-compose.override.yml:
labels:
  - traefik.enable=true
  - traefik.docker.network=coolify
  - traefik.http.routers.synkraflow.entrypoints=https
  - traefik.http.routers.synkraflow.rule=Host(`flow.synkra.co.za`) || Host(`automations.synkra.co.za`)
  - traefik.http.routers.synkraflow.service=synkraflow
  - traefik.http.routers.synkraflow.tls=true
  - traefik.http.routers.synkraflow.tls.certresolver=letsencrypt
  - traefik.http.services.synkraflow.loadbalancer.server.port=80
After changing labels, recreate the app container.

Traefik issues TLS certificates automatically via Let's Encrypt. Certificates
are stored in /data/coolify/proxy/acme.json on the host.
