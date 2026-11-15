import { ActivepiecesError, ErrorCode, SandboxExecutionTimeoutParams } from '@activepieces/core-utils'

export function isSandboxTimeout(e: unknown): e is ActivepiecesError & { error: SandboxExecutionTimeoutParams } {
    return e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT
}
