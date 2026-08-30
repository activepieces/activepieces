import { apId, isNil } from '@activepieces/core-utils'
import {
    FileCompression,
    FileType,
    MCP_ACTIVITY_PAYLOAD_MAX_BYTES,
    McpActivity,
    McpActivityKind,
    McpToolDefinition,
    McpToolResult,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { fileCompressor } from '../../file/file-compressor'
import { fileService } from '../../file/file.service'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { McpActivityEntity } from './mcp-activity.entity'

const repo = repoFactory(McpActivityEntity)

const RUN_ACTION_TOOL_NAME = 'ap_run_action'
const ERROR_MESSAGE_MAX_LENGTH = 2000

export function shouldRecord(tool: Pick<McpToolDefinition, 'title' | 'annotations'>): boolean {
    return tool.title === RUN_ACTION_TOOL_NAME || tool.annotations?.destructiveHint === true
}

export function withActivityRecording({ execute, tool, context, log }: WithActivityRecordingParams): McpToolDefinition['execute'] {
    if (!shouldRecord(tool)) {
        return execute
    }
    return async (args) => {
        const startedAt = Date.now()
        const result = await execute(args)
        rejectedPromiseHandler(record({
            context,
            toolName: tool.title,
            kind: tool.title === RUN_ACTION_TOOL_NAME ? 'ACTION' : 'PLATFORM_TOOL',
            ...pieceFieldsFrom(tool.title, args),
            durationMs: Date.now() - startedAt,
            input: args,
            result,
            log,
        }), log)
        return result
    }
}

export function recordFlowToolCall({ context, toolName, flowDisplayName, flowId, flowRunId, durationMs, input, result, log }: RecordFlowToolCallParams): void {
    rejectedPromiseHandler(record({
        context: () => Promise.resolve(context),
        toolName,
        kind: 'FLOW',
        actionName: flowDisplayName,
        flowId,
        flowRunId,
        durationMs,
        input,
        result,
        log,
    }), log)
}

// Every branch is bounded by MCP_ACTIVITY_PAYLOAD_MAX_BYTES: a single oversized input
// must not slip through by virtue of only the output being dropped.
export function capPayload({ input, output }: { input: Record<string, unknown>, output: unknown }): { body: Buffer, truncated: boolean } {
    const whole = Buffer.from(JSON.stringify({ input, output }), 'utf-8')
    if (whole.length <= MCP_ACTIVITY_PAYLOAD_MAX_BYTES) {
        return { body: whole, truncated: false }
    }
    const inputOnly = Buffer.from(JSON.stringify({ input, output: null }), 'utf-8')
    if (inputOnly.length <= MCP_ACTIVITY_PAYLOAD_MAX_BYTES) {
        return { body: inputOnly, truncated: true }
    }
    return { body: Buffer.from(JSON.stringify({ input: null, output: null }), 'utf-8'), truncated: true }
}

async function record({ context, toolName, kind, pieceName, actionName, flowId, flowRunId, durationMs, input, result, log }: RecordParams): Promise<void> {
    const resolved = await context()
    if (isNil(resolved)) {
        return
    }
    const payloadFile = await savePayload({ context: resolved, input, result, log })
    const activity: McpActivity = {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: resolved.platformId,
        projectId: resolved.projectId,
        userId: resolved.userId,
        toolName,
        kind,
        status: result.isError === true ? 'FAILED' : 'SUCCEEDED',
        pieceName: pieceName ?? null,
        actionName: actionName ?? null,
        flowId: flowId ?? null,
        flowRunId: flowRunId ?? null,
        errorMessage: errorMessageFrom(result),
        durationMs,
        payloadFileId: payloadFile?.id ?? null,
        payloadTruncated: payloadFile?.truncated ?? false,
    }
    await repo().insert(activity)
}

async function savePayload({ context, input, result, log }: SavePayloadParams): Promise<{ id: string, truncated: boolean } | null> {
    try {
        const { body, truncated } = capPayload({ input, output: result.content })
        const compressed = await fileCompressor.compress({ data: body, compression: FileCompression.ZSTD })
        const file = await fileService(log).save({
            type: FileType.MCP_CALL_PAYLOAD,
            compression: FileCompression.ZSTD,
            data: compressed,
            platformId: context.platformId,
            ...(isNil(context.projectId) ? {} : { projectId: context.projectId }),
        })
        return { id: file.id, truncated }
    }
    catch (error) {
        log.warn({ error }, '[mcpActivityRecorder] failed to store payload')
        return null
    }
}

function pieceFieldsFrom(toolName: string, args: Record<string, unknown>): { pieceName?: string, actionName?: string } {
    if (toolName !== RUN_ACTION_TOOL_NAME) {
        return {}
    }
    return {
        ...(typeof args.pieceName === 'string' ? { pieceName: args.pieceName } : {}),
        ...(typeof args.actionName === 'string' ? { actionName: args.actionName } : {}),
    }
}

function errorMessageFrom(result: McpToolResult): string | null {
    if (result.isError !== true) {
        return null
    }
    const text = result.content.map((part) => part.text).join('\n').trim()
    return text.length === 0 ? null : text.slice(0, ERROR_MESSAGE_MAX_LENGTH)
}

export type McpActivityContext = {
    platformId: string
    projectId: string | null
    userId: string
}

type WithActivityRecordingParams = {
    execute: McpToolDefinition['execute']
    tool: Pick<McpToolDefinition, 'title' | 'annotations'>
    context: () => Promise<McpActivityContext | null>
    log: FastifyBaseLogger
}

type RecordFlowToolCallParams = {
    context: McpActivityContext | null
    toolName: string
    flowDisplayName: string
    flowId: string
    flowRunId: string | null
    durationMs: number
    input: Record<string, unknown>
    result: McpToolResult
    log: FastifyBaseLogger
}

type RecordParams = {
    context: () => Promise<McpActivityContext | null>
    toolName: string
    kind: McpActivityKind
    pieceName?: string
    actionName?: string
    flowId?: string
    flowRunId?: string | null
    durationMs: number
    input: Record<string, unknown>
    result: McpToolResult
    log: FastifyBaseLogger
}

type SavePayloadParams = {
    context: McpActivityContext
    input: Record<string, unknown>
    result: McpToolResult
    log: FastifyBaseLogger
}
