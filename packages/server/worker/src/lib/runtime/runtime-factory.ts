import { type ApLogger } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, RuntimeKind } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../config/configs'
import { createAwsLambdaRuntime } from './serverless/aws-lambda/aws-lambda-runtime'
import { createGcpCloudFunctionRuntime } from './serverless/gcp-cloud-function/gcp-cloud-function-runtime'
import { Runtime } from './types'
import { createWorkerPoolRuntime } from './worker-pool/worker-pool-runtime'

export function selectRuntime({ concurrency, proxyPort, log }: SelectRuntimeParams): Runtime {
    const kind = resolveRuntimeKind()
    log.info({ runtime: { kind }, concurrency }, 'Selecting execution runtime')
    switch (kind) {
        case RuntimeKind.WORKER_POOL:
            return createWorkerPoolRuntime({ concurrency, proxyPort })
        case RuntimeKind.AWS_LAMBDA:
            return createAwsLambdaRuntime()
        case RuntimeKind.GCP_CLOUD_FUNCTION:
            return createGcpCloudFunctionRuntime()
    }
}

function resolveRuntimeKind(): RuntimeKind {
    const raw = system.get(WorkerSystemProp.RUNTIME) ?? RuntimeKind.WORKER_POOL
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
    proxyPort: number | null
    log: ApLogger
}
