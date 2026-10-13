import { RuntimeExecutionResult } from '@activepieces/sandbox'
import { JobResultKind, SynchronousJobResult } from '../types'

export function buildSynchronousResult(result: RuntimeExecutionResult): SynchronousJobResult {
    return {
        kind: JobResultKind.SYNCHRONOUS,
        status: result.status,
        response: result.response,
        errorMessage: result.error,
        logs: result.logs,
    }
}
