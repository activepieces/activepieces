import { apId, isNil, isObject, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import {
    FileCompression,
    FileType,
    MCP_ACTIVITY_PAYLOAD_MAX_BYTES,
    McpActivity,
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
const NAME_MAX_LENGTH = 256

export function shouldRecord(tool: Pick<McpToolDefinition, 'title'>): boolean {
    return tool.title === RUN_ACTION_TOOL_NAME
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
            ...runActionFieldsFrom(args),
            durationMs: Date.now() - startedAt,
            input: args,
            result,
            log,
        }), log)
        return result
    }
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

export function runActionFieldsFrom(args: Record<string, unknown>): { pieceName?: string, actionName?: string, connectionExternalId?: string } {
    const inlineAuth = isObject(args.input) ? args.input.auth : undefined
    const connectionExternalId = typeof args.connectionExternalId === 'string'
        ? args.connectionExternalId
        : (typeof inlineAuth === 'string' ? inlineAuth : undefined)
    return {
        ...(typeof args.pieceName === 'string' ? { pieceName: args.pieceName.slice(0, NAME_MAX_LENGTH) } : {}),
        ...(typeof args.actionName === 'string' ? { actionName: args.actionName.slice(0, NAME_MAX_LENGTH) } : {}),
        ...(isNil(connectionExternalId) ? {} : { connectionExternalId: connectionExternalId.slice(0, NAME_MAX_LENGTH) }),
    }
}

async function record({ context, toolName, pieceName, actionName, connectionExternalId, durationMs, input, result, log }: RecordParams): Promise<void> {
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
        status: result.isError === true ? 'FAILED' : 'SUCCEEDED',
        pieceName: pieceName ?? null,
        actionName: actionName ?? null,
        connectionExternalId: connectionExternalId ?? null,
        errorMessage: errorMessageFrom(result),
        durationMs,
        payloadFileId: payloadFile?.id ?? null,
        payloadTruncated: payloadFile?.truncated ?? false,
    }
    await repo().insert(sanitizeObjectForPostgresql(activity))
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
    tool: Pick<McpToolDefinition, 'title'>
    context: () => Promise<McpActivityContext | null>
    log: FastifyBaseLogger
}

type RecordParams = {
    context: () => Promise<McpActivityContext | null>
    toolName: string
    pieceName?: string
    actionName?: string
    connectionExternalId?: string
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
