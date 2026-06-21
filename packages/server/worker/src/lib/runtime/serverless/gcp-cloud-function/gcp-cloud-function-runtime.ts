import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { CreateExecutionParams, Runtime, RuntimeExecution, RuntimeExecutorInfo } from '../../types'

// Extension point for running the engine on GCP Cloud Functions. Not implemented yet — see the AWS
// Lambda stub and [[project_multi_runtime_engine_install]] for what a real implementation needs.
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
