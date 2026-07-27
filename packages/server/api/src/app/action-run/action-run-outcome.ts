import { ActivepiecesError, ErrorCode, isNil, Result } from '@activepieces/core-utils'
import { EngineResponseStatus, ExecuteActionResponse, FlowRunStatus } from '@activepieces/shared'
import { WORKER_DID_NOT_RESPOND_MESSAGE } from '../workers/user-interaction-watcher'

function deriveStatus(engineResponse: EngineActionResponse): FlowRunStatus {
    switch (engineResponse.status) {
        case EngineResponseStatus.OK:
            return engineResponse.response.success ? FlowRunStatus.SUCCEEDED : FlowRunStatus.FAILED
        case EngineResponseStatus.TIMEOUT:
            return FlowRunStatus.TIMEOUT
        default:
            return FlowRunStatus.INTERNAL_ERROR
    }
}

function deriveErrorMessage(engineResponse: EngineActionResponse, status: FlowRunStatus): string | null {
    if (status === FlowRunStatus.SUCCEEDED) {
        return null
    }
    if (!isNil(engineResponse.response?.message)) {
        return String(engineResponse.response.message)
    }
    if (!isNil(engineResponse.error)) {
        return engineResponse.error
    }
    return null
}

function isWatcherTimeout(error: unknown): boolean {
    return error instanceof ActivepiecesError
        && error.error.code === ErrorCode.ENGINE_OPERATION_FAILURE
        && error.error.params.message === WORKER_DID_NOT_RESPOND_MESSAGE
}

export function deriveActionRunOutcome({ result }: { result: Result<EngineActionResponse, unknown> }): ActionRunOutcome {
    if (!isNil(result.error) || isNil(result.data)) {
        return {
            status: isWatcherTimeout(result.error) ? FlowRunStatus.TIMEOUT : FlowRunStatus.INTERNAL_ERROR,
            output: null,
            logs: null,
            errorMessage: result.error instanceof Error ? result.error.message : String(result.error),
            neverStarted: false,
        }
    }
    const engineResponse = result.data
    const status = deriveStatus(engineResponse)
    return {
        status,
        output: status === FlowRunStatus.SUCCEEDED ? engineResponse.response.output : null,
        logs: isNil(engineResponse.logs) ? null : engineResponse.logs,
        errorMessage: deriveErrorMessage(engineResponse, status),
        neverStarted: engineResponse.response?.neverStarted === true,
    }
}

export type EngineActionResponse = {
    status: EngineResponseStatus
    response: ExecuteActionResponse
    error?: string
    logs?: string
}

export type ActionRunOutcome = {
    status: FlowRunStatus
    output: unknown
    logs: string | null
    errorMessage: string | null
    neverStarted: boolean
}
