import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { type Runtime } from '@activepieces/sandbox-pool'
import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../config/configs'
import { createCloudRunRuntime } from './cloud-run-runtime'
import { createLocalRuntime } from './local-runtime'

// Selects the host that runs the sandbox pool, by AP_RUNTIME. The execution path is identical across
// hosts (the pool); only where/how it is deployed differs. See ADR 0001.
export function selectRuntime({ concurrency, log }: SelectRuntimeParams): Runtime {
    const kind = resolveRuntimeKind()
    log.info({ runtime: { kind }, concurrency }, 'Selecting execution runtime')
    switch (kind) {
        case RuntimeKind.LOCAL:
            return createLocalRuntime({ concurrency, log })
        case RuntimeKind.GCP_CLOUD_RUN:
            return createCloudRunRuntime({ log })
    }
}

export function resolveRuntimeKind(): RuntimeKind {
    const raw = system.get(WorkerSystemProp.RUNTIME) ?? RuntimeKind.LOCAL
    const match = Object.values(RuntimeKind).find((kind) => kind === raw)
    if (match === undefined) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: { prop: WorkerSystemProp.RUNTIME },
        }, `Unknown runtime "${raw}". Valid values: ${Object.values(RuntimeKind).join(', ')}`)
    }
    return match
}

type SelectRuntimeParams = {
    concurrency: number
    log: ApLogger
}
