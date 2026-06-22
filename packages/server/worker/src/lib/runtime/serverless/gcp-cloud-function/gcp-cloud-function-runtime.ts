import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { CreateExecutionParams, Runtime, RuntimeExecution, RuntimeExecutorInfo } from '../../types'

// Extension point for running the engine on GCP Cloud Functions. Not implemented yet: the seam
// exists so the rest of the worker (polling, job handlers, lifecycle) compiles against it. A real
// implementation provisions by installing the flow's bundled .tgz pieces in parallel inside the
// function (no local cache) and runs via a direct-to-API WorkerContract transport (there is no
// loopback socket peer) — see [[project_multi_runtime_engine_install]].
export function createGcpCloudFunctionRuntime(): Runtime {
    return {
        kind: RuntimeKind.GCP_CLOUD_FUNCTION,
        createExecution(_params: CreateExecutionParams): RuntimeExecution {
            throw notImplemented()
        },
        getActiveExecutors(): RuntimeExecutorInfo[] {
            return []
        },
        async shutdown(_log: ApLogger): Promise<void> {
            // nothing to tear down for a not-yet-implemented runtime
        },
    }
}

function notImplemented(): Error {
    return new Error('GCP Cloud Function runtime is not implemented yet')
}
