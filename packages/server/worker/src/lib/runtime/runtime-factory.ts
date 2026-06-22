import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../config/configs'
import { createLocalPoolRuntime } from './local-pool/local-pool-runtime'
import { createGcpCloudFunctionRuntime } from './serverless/gcp-cloud-function/gcp-cloud-function-runtime'
import { Runtime } from './types'

export function selectRuntime({ concurrency, log }: SelectRuntimeParams): Runtime {
    const kind = resolveRuntimeKind()
    log.info({ runtime: { kind }, concurrency }, 'Selecting execution runtime')
    switch (kind) {
        case RuntimeKind.LOCAL_POOL:
            return createLocalPoolRuntime({ concurrency })
        case RuntimeKind.GCP_CLOUD_FUNCTION:
            return createGcpCloudFunctionRuntime()
    }
}

function resolveRuntimeKind(): RuntimeKind {
    const raw = system.get(WorkerSystemProp.RUNTIME) ?? RuntimeKind.LOCAL_POOL
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
