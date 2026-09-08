import { ActivepiecesError, ErrorCode, SandboxExecutionTimeoutParams } from '@activepieces/core-utils'
import { EngineResponseStatus, FlowRunStatus } from '@activepieces/shared'

export function isSandboxTimeout(e: unknown): e is ActivepiecesError & { error: SandboxExecutionTimeoutParams } {
    return e instanceof ActivepiecesError && e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT
}

export function sandboxErrorToFlowRunStatus(error: unknown): FlowRunStatus {
    if (isSandboxTimeout(error)) {
        return FlowRunStatus.TIMEOUT
    }
    if (error instanceof ActivepiecesError) {
        if (error.error.code === ErrorCode.SANDBOX_MEMORY_ISSUE) {
            return FlowRunStatus.MEMORY_LIMIT_EXCEEDED
        }
        if (error.error.code === ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED) {
            return FlowRunStatus.LOG_SIZE_EXCEEDED
        }
    }
    return FlowRunStatus.INTERNAL_ERROR
}

export function flowRunStatusToEngineResponseStatus(status: FlowRunStatus): EngineResponseStatus {
    switch (status) {
        case FlowRunStatus.TIMEOUT: return EngineResponseStatus.TIMEOUT
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED: return EngineResponseStatus.MEMORY_ISSUE
        case FlowRunStatus.LOG_SIZE_EXCEEDED: return EngineResponseStatus.LOG_SIZE_EXCEEDED
        default: return EngineResponseStatus.INTERNAL_ERROR
    }
}
