import { isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
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

function sanitizeValue(value: unknown): unknown {
    if (isNil(value) || typeof value !== 'object') {
        return value
    }
    return sanitizeObjectForPostgresql(value as Record<string, unknown>)
}

function withPayloadGate(outcome: Omit<AdhocRunOutcome, 'hasPayload'>): AdhocRunOutcome {
    const hasPayload = !isNil(outcome.input) || !isNil(outcome.output) || !isNil(outcome.logs)
    return { ...outcome, hasPayload }
}

function derive({ engineResult, input }: { engineResult: EngineResult, input: unknown }): AdhocRunOutcome {
    const sanitizedInput = sanitizeValue(input)
    if (engineResult.kind === 'error') {
        return withPayloadGate({
            status: FlowRunStatus.INTERNAL_ERROR,
            input: sanitizedInput,
            output: null,
            logs: null,
            errorMessage: engineResult.error instanceof Error ? engineResult.error.message : String(engineResult.error),
        })
    }
    const engineResponse = engineResult.value
    const status = deriveStatus(engineResponse)
    return withPayloadGate({
        status,
        input: sanitizedInput,
        output: status === FlowRunStatus.SUCCEEDED ? sanitizeValue(engineResponse.response.output) : null,
        logs: isNil(engineResponse.logs) ? null : engineResponse.logs,
        errorMessage: deriveErrorMessage(engineResponse, status),
    })
}

export const adhocRunOutcome = { derive }

export type EngineActionResponse = {
    status: EngineResponseStatus
    response: ExecuteActionResponse
    error?: string
    logs?: string
}

export type EngineResult =
    | { kind: 'response', value: EngineActionResponse }
    | { kind: 'error', error: unknown }

export type AdhocRunOutcome = {
    status: FlowRunStatus
    input: unknown
    output: unknown
    logs: string | null
    errorMessage: string | null
    hasPayload: boolean
}
