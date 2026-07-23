import { isNil, Result, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { EngineResponseStatus, ExecuteActionResponse, FlowRunStatus } from '@activepieces/shared'

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

function withPayloadGate(outcome: Omit<ActionRunOutcome, 'hasPayload'>): ActionRunOutcome {
    const hasPayload = !isNil(outcome.input) || !isNil(outcome.output) || !isNil(outcome.logs)
    return { ...outcome, hasPayload }
}

export function deriveActionRunOutcome({ result, input }: { result: Result<EngineActionResponse, unknown>, input: unknown }): ActionRunOutcome {
    const sanitizedInput = sanitizeObjectForPostgresql(input)
    if (!isNil(result.error) || isNil(result.data)) {
        return withPayloadGate({
            status: FlowRunStatus.INTERNAL_ERROR,
            input: sanitizedInput,
            output: null,
            logs: null,
            errorMessage: result.error instanceof Error ? result.error.message : String(result.error),
        })
    }
    const engineResponse = result.data
    const status = deriveStatus(engineResponse)
    return withPayloadGate({
        status,
        input: sanitizedInput,
        output: status === FlowRunStatus.SUCCEEDED ? sanitizeObjectForPostgresql(engineResponse.response.output) : null,
        logs: isNil(engineResponse.logs) ? null : engineResponse.logs,
        errorMessage: deriveErrorMessage(engineResponse, status),
    })
}

export type EngineActionResponse = {
    status: EngineResponseStatus
    response: ExecuteActionResponse
    error?: string
    logs?: string
}

export type ActionRunOutcome = {
    status: FlowRunStatus
    input: unknown
    output: unknown
    logs: string | null
    errorMessage: string | null
    hasPayload: boolean
}
