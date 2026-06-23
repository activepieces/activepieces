import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'

export function isSandboxTimeout(e: unknown): boolean {
    return e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT
}
