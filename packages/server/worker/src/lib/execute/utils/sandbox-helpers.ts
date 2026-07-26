import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'

export function isSandboxTimeout(e: unknown): boolean {
    return e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT
}

export function sandboxTimeoutNeverStarted(e: unknown): boolean {
    if (!(e instanceof ActivepiecesError) || e.error.code !== ErrorCode.SANDBOX_EXECUTION_TIMEOUT) {
        return false
    }
    return e.error.params.neverStarted === true
}
