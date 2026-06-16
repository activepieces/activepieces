# Engine function image.
#
# This is the unit of deployment for the CLOUD_FUNCTION runtime: it serves the engine HTTP
# contract (`GET /health`, `POST /execute` with a Bearer token) on $AP_ENGINE_PORT. The exact
# same image runs locally in docker-compose (the smoke test) and on Cloud Run per project.
#
# The bundle is produced on the host/CI by esbuild (deploy/cloud-function-runtime/build.sh),
# which is far faster and lighter than running a full monorepo install inside Docker. zstd log
# compression requires Node >= 22.15, so the runtime base is node:22-slim.
FROM node:22-slim

WORKDIR /app

COPY dist/packages/engine/main.js ./main.js

ENV AP_ENGINE_PORT=8080
ENV AP_ENGINE_HOST=0.0.0.0
ENV AP_EXECUTION_MODE=UNSANDBOXED

EXPOSE 8080

CMD ["node", "main.js"]
