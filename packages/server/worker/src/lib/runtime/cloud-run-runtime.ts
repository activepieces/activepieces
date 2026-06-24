import { ActivepiecesError, type ApErrorParams, ensureTrailingSlash, ErrorCode, tryCatch } from '@activepieces/core-utils'
import { type ExecuteParams, type ExecuteResponse, type Runtime, type RuntimeExecutionResult, type RuntimeExecutorInfo } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../config/configs'
import { cloudRunProvisioner } from './cloud-run-provisioner'
import { sandboxConfig } from './sandbox-config'

// The GCP_CLOUD_RUN host. The worker stays the Resolver + puller; this runtime is a thin HTTP client of
// the Pool Server's POST /execute. The Pool Server is auto-provisioned by the worker itself: on the first
// execute it deploys (or reuses) a Cloud Run service from POOL_SERVER_IMAGE and learns its URL, so there
// is no URL/token to configure — only GCP credentials (ADC) and an optional region. The shared secret is
// a baked-in constant: the worker both deploys the pool with it and authenticates against it. See ADR
// 0001 / ADR 0003.

const POOL_SERVER_SERVICE_NAME = 'ap-pool-server'
const POOL_SERVER_IMAGE = 'europe-west1-docker.pkg.dev/activepieces-b3803/poolserver/poolserver:latest'
const POOL_SERVER_TOKEN = 'ap-pool-server-4f1c9a7e2b6d4f0a8c3e5d7b9a1f3c2e'

export function createCloudRunRuntime(): Runtime {
    const region = system.get(WorkerSystemProp.GCP_REGION) ?? 'europe-west1'
    // Escape hatch: point at an already-running Pool Server (self-hosted pool / local debugging) to
    // skip auto-provisioning entirely.
    const poolServerUrlOverride = process.env['AP_POOL_SERVER_URL']
    // Sizing knobs: one instance runs `concurrency` flows, sized so each gets cpu/(concurrency) cores.
    const cpu = Number(process.env['AP_POOL_CPU'] ?? 1)
    const memory = process.env['AP_POOL_MEMORY'] ?? '1Gi'
    const concurrency = Number(process.env['AP_POOL_CONCURRENCY'] ?? 1)
    const maxInstances = Number(process.env['AP_POOL_MAX_INSTANCES'] ?? 100)
    let executeUrlPromise: Promise<string> | undefined

    function ensureExecuteUrl(log: ApLogger): Promise<string> {
        if (executeUrlPromise === undefined) {
            const baseUrlPromise = poolServerUrlOverride !== undefined
                ? Promise.resolve(poolServerUrlOverride)
                : cloudRunProvisioner.ensureService({
                    region,
                    serviceName: POOL_SERVER_SERVICE_NAME,
                    image: POOL_SERVER_IMAGE,
                    token: POOL_SERVER_TOKEN,
                    cacheBasePath: '/tmp/cache',
                    timeoutSeconds: sandboxConfig.getSandboxPoolSettings().FLOW_TIMEOUT_SECONDS + 30,
                    cpu,
                    memory,
                    concurrency,
                    maxInstances,
                    log,
                })
            executeUrlPromise = baseUrlPromise.then((baseUrl) => `${ensureTrailingSlash(baseUrl)}execute`)
            // A failed provision must not be cached, or every later execute reuses the rejection.
            executeUrlPromise.catch(() => {
                executeUrlPromise = undefined 
            })
        }
        return executeUrlPromise
    }

    return {
        kind: RuntimeKind.GCP_CLOUD_RUN,
        async execute({ operationType, operation, timeoutInSeconds, provision, log }: ExecuteParams): Promise<RuntimeExecutionResult> {
            const executeUrl = await ensureExecuteUrl(log)
            const controller = new AbortController()
            // Mirror the in-process sandbox timeout, plus buffer for transport / cold start.
            const timer = setTimeout(() => controller.abort(), (timeoutInSeconds + 15) * 1000)

            const response = await tryCatch(() => fetch(executeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${POOL_SERVER_TOKEN}` },
                body: JSON.stringify({
                    operationType,
                    operation,
                    timeoutInSeconds,
                    provision,
                    settings: sandboxConfig.getSandboxPoolSettings(),
                }),
                signal: controller.signal,
            }))
            clearTimeout(timer)

            // No retry: the engine may already have run side effects (callbacks / sendFlowResponse), so any
            // transport failure surfaces as INTERNAL_ERROR and the job retries at the BullMQ level. ADR 0003.
            if (response.error !== null) {
                throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: `Pool Server request failed: ${String(response.error)}` } })
            }
            if (!response.data.ok) {
                throw new ActivepiecesError({ code: ErrorCode.ENGINE_OPERATION_FAILURE, params: { message: `Pool Server returned HTTP ${response.data.status}` } })
            }

            // Deserialization boundary: the Pool Server is trusted and returns the ExecuteResponse shape.
            const envelope = await response.data.json() as ExecuteResponse
            if (envelope.ok) {
                return envelope.result
            }
            // Reconstruct the sandbox ActivepiecesError so handlers branch identically to LOCAL. The code is
            // dynamic, so the discriminated ApErrorParams is rebuilt at this boundary.
            log.error({ pool: { errorCode: envelope.errorCode, params: envelope.params } }, 'Pool Server returned an error envelope')
            const code = Object.values(ErrorCode).find((value) => value === envelope.errorCode) ?? ErrorCode.ENGINE_OPERATION_FAILURE
            throw new ActivepiecesError({ code, params: envelope.params ?? {} } as ApErrorParams)
        },
        getActiveExecutors(): RuntimeExecutorInfo[] {
            return []
        },
        async shutdown(_log: ApLogger): Promise<void> {
            // No local pool to tear down; the Cloud Run service outlives the worker.
        },
    }
}
