import { type ApLogger } from '@activepieces/server-utils'
import { RuntimeKind } from '@activepieces/shared'
import { CreateExecutionParams, Runtime, RuntimeExecution, RuntimeExecutorInfo } from '../../types'

// Extension point for running the engine on AWS Lambda. Not implemented yet: the seam exists so the
// rest of the worker (polling, job handlers, lifecycle) compiles against it. A real implementation
// provisions by shipping a bundled .tgz the function installs, and runs by invoking the function
// with a direct-to-API WorkerContract transport — see [[project_multi_runtime_engine_install]].
export function createAwsLambdaRuntime(): Runtime {
    return {
        kind: RuntimeKind.AWS_LAMBDA,
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
    return new Error('AWS Lambda runtime is not implemented yet')
}
