import { ExecutionToolStatus } from './agents'

export type ExecuteToolResponse = {
    status: ExecutionToolStatus
    output?: unknown
    resolvedInput: Record<string, unknown>
    errorMessage?: unknown
}

export function normalizeToolOutputToExecuteResponse(
    raw: unknown,
): ExecuteToolResponse {
    if (raw === null || typeof raw !== 'object') {
        return {
            status: ExecutionToolStatus.FAILED,
            output: raw,
            resolvedInput: {},
            errorMessage: 'Invalid tool output',
        }
    }
    const o = raw as Record<string, unknown>
    if (
        o['status'] === ExecutionToolStatus.SUCCESS ||
        o['status'] === ExecutionToolStatus.FAILED
    ) {
        return {
            status: o['status'] as ExecutionToolStatus,
            output: o['output'],
            resolvedInput: (o['resolvedInput'] as Record<string, unknown>) ?? {},
            errorMessage: o['errorMessage'],
        }
    }
    const isError = o['isError'] === true
    let output: unknown = o['structuredContent']
    if (output === undefined && Array.isArray(o['content'])) {
        const parts = (o['content'] as { text?: string }[])
            .map((c) => c?.text)
            .filter(Boolean)
        output =
            parts.length === 1
                ? parts[0]
                : parts.length
                    ? { text: parts.join('') }
                    : o['content']
    }
    if (output === undefined) {
        output = o
    }
    return {
        status: isError ? ExecutionToolStatus.FAILED : ExecutionToolStatus.SUCCESS,
        output,
        resolvedInput: {},
        errorMessage: isError
            ? ((o['content'] as { text?: string }[])?.[0]?.text as string) ??
              (o['message'] as string) ??
              'Tool failed'
            : undefined,
    }
}
