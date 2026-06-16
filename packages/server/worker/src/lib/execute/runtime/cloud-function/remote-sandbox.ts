import { setTimeout as delay } from 'timers/promises'
import { ActivepiecesError, EngineOperation, EngineOperationType, EngineResponse, ErrorCode, tryCatch } from '@activepieces/shared'
import { Sandbox, SandboxLogger, SandboxOptions, SandboxResult } from '../sandbox-contract'

const READINESS_TIMEOUT_MS = 30_000
const READINESS_POLL_INTERVAL_MS = 250

// A remote sandbox is a thin client over a provisioned engine function (Cloud Run / Cloud
// Function) reachable at a stable URL. Unlike the worker-pool sandbox it owns no child
// process: there is no pid, no mounts and nothing to kill — the function is shared, persistent
// infrastructure that the provisioner guarantees exists. The HTTP contract is identical to the
// loopback engine (`GET /health`, `POST /execute` with a Bearer token), so the worker job code
// drives it through the same Sandbox interface without knowing where the engine runs.
export function createRemoteSandbox({ id, functionUrl, engineToken, log }: CreateRemoteSandboxParams): Sandbox {
    const baseUrl = functionUrl.replace(/\/+$/, '')
    let started = false
    let busy = false

    async function waitForFunctionReady(): Promise<void> {
        const deadline = Date.now() + READINESS_TIMEOUT_MS
        let lastError: unknown
        while (Date.now() < deadline) {
            const { data: ready, error } = await tryCatch(async () => {
                const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) })
                return response.ok
            })
            if (ready) {
                return
            }
            lastError = error
            await delay(READINESS_POLL_INTERVAL_MS)
        }
        throw new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: {
                reason: `Remote function ${id} did not become ready within ${READINESS_TIMEOUT_MS}ms`,
                standardOutput: '',
                standardError: String(lastError ?? 'health check never succeeded'),
            },
        })
    }

    return {
        id,
        start: async () => {
            if (started) {
                return
            }
            log.debug({ sandboxId: id, functionUrl: baseUrl }, 'Probing remote function readiness')
            await waitForFunctionReady()
            started = true
            log.debug({ sandboxId: id }, 'Remote function ready')
        },
        execute: async (operationType: EngineOperationType, operation: EngineOperation, executeOptions: SandboxOptions): Promise<SandboxResult> => {
            busy = true
            try {
                return await postOperationToFunction({
                    baseUrl,
                    engineToken,
                    operationType,
                    operation,
                    timeoutInSeconds: executeOptions.timeoutInSeconds,
                    log,
                    sandboxId: id,
                })
            }
            finally {
                busy = false
            }
        },
        isReady: () => started,
        getPid: () => null,
        isBusy: () => busy,
        shutdown: async () => {
            started = false
        },
    }
}

async function postOperationToFunction({ baseUrl, engineToken, operationType, operation, timeoutInSeconds, log, sandboxId }: PostOperationParams): Promise<SandboxResult> {
    const operationTimeoutMs = (timeoutInSeconds + 5) * 1000
    const { data: response, error } = await tryCatch(() => fetch(`${baseUrl}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify({ operationType, operation }),
        signal: AbortSignal.timeout(operationTimeoutMs),
    }))

    if (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            throw new ActivepiecesError({
                code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
                params: { standardOutput: '', standardError: `Remote function ${sandboxId} timed out after ${operationTimeoutMs}ms` },
            })
        }
        log.error({ sandboxId, error: String(error) }, '[RemoteSandbox] HTTP execute failed')
        throw new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: { reason: `Remote function ${sandboxId} request failed`, standardOutput: '', standardError: String(error) },
        })
    }

    const bodyText = await response.text()
    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.SANDBOX_INTERNAL_ERROR,
            params: {
                reason: `Remote function ${sandboxId} returned HTTP ${response.status}`,
                standardOutput: '',
                standardError: bodyText,
            },
        })
    }

    const body: EngineHttpExecuteResponse = JSON.parse(bodyText)
    return { ...body.engineResponse, logs: body.logs }
}

type CreateRemoteSandboxParams = {
    id: string
    functionUrl: string
    engineToken: string
    log: SandboxLogger
}

type PostOperationParams = {
    baseUrl: string
    engineToken: string
    operationType: EngineOperationType
    operation: EngineOperation
    timeoutInSeconds: number
    log: SandboxLogger
    sandboxId: string
}

type EngineHttpExecuteResponse = {
    engineResponse: EngineResponse<unknown>
    logs?: string
}
