#!/usr/bin/env bash
#
# Build and run the privileged sandbox/SSRF integration test container.
# Requires a local Docker daemon. See packages/server/worker/test/e2e/README.md.

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required to run the sandbox e2e suite. Install Docker Desktop or similar." >&2
    exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCKERFILE="$ROOT/packages/server/worker/test/e2e/Dockerfile"
IMAGE="activepieces-sandbox-e2e:local"

echo "=> Building image $IMAGE"
docker build -f "$DOCKERFILE" -t "$IMAGE" "$ROOT"

echo "=> Running sandbox e2e suite (privileged)"
# --privileged is required because isolate needs CAP_SYS_ADMIN for mount namespaces and
# netns/veth creation needs CAP_NET_ADMIN. We drop other ambient bits by default.
#
# Any args passed to this script are forwarded to vitest (e.g. a subset of *.e2e.test.ts
# files), appended to the default command so the --config flag is preserved. With no args
# the image CMD runs the full suite.
if [ "$#" -gt 0 ]; then
    exec docker run --rm \
        --privileged \
        --network bridge \
        -e E2E_LOG_LEVEL="${E2E_LOG_LEVEL:-warn}" \
        "$IMAGE" bun x vitest run --config packages/server/worker/test/e2e/vitest.config.ts "$@"
fi

exec docker run --rm \
    --privileged \
    --network bridge \
    -e E2E_LOG_LEVEL="${E2E_LOG_LEVEL:-warn}" \
    "$IMAGE"
