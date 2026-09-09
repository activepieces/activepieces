import { chunk, isObject, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { AgentKnowledgeBaseTool, AgentPieceTool, AgentPieceToolMetadata, agentToolClassification, apErrorOf, BatchItemResult, ExecutePieceToolResponse, KnowledgeBaseSourceType, ResolvedAgentFlowTool } from '@activepieces/shared'
import { jsonSchema, JSONSchema7, tool, ToolSet } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { AgentEventEmitter, extractUserFacingError, isSuccessResult, TaintState, truncateForCard, truncateLargeResult } from './tool-primitives'

export const MAX_BATCH_SIZE = 100
const MAX_CONFIGURED_TOOL_CALLS = 50
export const MAX_IDENTICAL_ACTION_FAILURES = 2
export async function executeBatchAction({ executeWithTimeout, eventEmitter, toolCallId, pieceName, actionName, items, description }: {
    executeWithTimeout: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
    eventEmitter: AgentEventEmitter
    toolCallId: string
    pieceName: string
    actionName: string
    items: Record<string, unknown>[]
    description?: string
}): Promise<unknown> {
    const total = items.length
    const label = description ?? `Processing ${total} ${total === 1 ? 'item' : 'items'}`
    const results: BatchItemResult[] = []
    let succeeded = 0
    let failed = 0

    function pushProgress({ done }: { done: boolean }): void {
        eventEmitter.emitToolProgress({
            toolCallId,
            data: {
                label,
                total,
                completed: results.length,
                succeeded,
                failed,
                done,
                results: done ? results : [],
            },
        })
    }

    const CONSECUTIVE_FAILURE_LIMIT = 3
    const CONCURRENCY_LIMIT = 5
    let consecutiveFailures = 0
    let stoppedEarly = false

    pushProgress({ done: false })

    const chunks = chunk(items, CONCURRENCY_LIMIT)
    let itemOffset = 0
    for (const batch of chunks) {
        if (stoppedEarly) break
        const batchResults = await Promise.all(
            batch.map(async (item, offset) => {
                const idx = itemOffset + offset
                const { data: result, error } = await tryCatch(() => executeWithTimeout('ap_execute_action', {
                    pieceName, actionName, input: item,
                }))
                if (error) return { index: idx, success: false as const, error: truncateForCard(error.message) }
                if (isSuccessResult(result)) return { index: idx, success: true as const, output: result }
                const resultObj = isObject(result) ? result as Record<string, unknown> : undefined
                const meta = isObject(resultObj?.['_meta']) ? resultObj!['_meta'] as Record<string, unknown> : undefined
                return { index: idx, success: false as const, error: extractUserFacingError({ result, meta }) }
            }),
        )
        for (const r of batchResults) {
            if (r.success) {
                succeeded++
                consecutiveFailures = 0
                results.push({ index: r.index, success: true, output: r.output })
            }
            else {
                failed++
                consecutiveFailures++
                results.push({ index: r.index, success: false, error: r.error })
            }
        }
        itemOffset += batch.length
        stoppedEarly = consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT
        pushProgress({ done: stoppedEarly || itemOffset >= items.length })
    }

    const failureSummary = failed > 0
        ? results
            .filter((r) => !r.success)
            .map((r) => `#${r.index + 1}: ${r.error ?? 'unknown error'}`)
            .join('\n')
        : ''

    const batchProgress = {
        label,
        total,
        completed: results.length,
        succeeded,
        failed,
        done: true,
        results,
    }

    const skipped = total - results.length

    return {
        content: [{
            type: 'text',
            text: `Batch complete: ${succeeded}/${total} succeeded, ${failed} failed.`
                + (skipped > 0 ? ` Stopped early after ${CONSECUTIVE_FAILURE_LIMIT} consecutive failures (${skipped} items skipped).` : '')
                + (failed > 0 ? `\n\nFailed items:\n${failureSummary}` : ''),
        }],
        batchProgress,
    }
}

export function createConfiguredPieceTools({ tools, runPieceTool, taintState, eventEmitter, log }: {
    tools: AgentPieceTool[]
    runPieceTool: (input: { toolName: string, instruction: string, piece: AgentPieceToolMetadata }) => Promise<ExecutePieceToolResponse>
    taintState: TaintState
    eventEmitter: AgentEventEmitter
    log: FastifyBaseLogger
}): ToolSet {
    let callsMade = 0
    return Object.fromEntries(tools.map((configured) => [
        configured.toolName,
        tool({
            description: `Run the "${configured.pieceMetadata.actionName}" action of ${configured.pieceMetadata.pieceName.replace('@activepieces/piece-', '')}. Describe what it should do, including any values it needs; the inputs are worked out from that. Fields the flow author pinned keep their value whatever you ask for. Returns the action's own output, or why it failed.`,
            inputSchema: z.object({
                instruction: z.string().describe('What this action should do, including any values it needs, in plain language'),
            }),
            execute: async ({ instruction }, options) => {
                callsMade += 1
                if (callsMade > MAX_CONFIGURED_TOOL_CALLS) {
                    log.warn({ tool: { name: configured.toolName }, callsMade }, '[configuredPieceTool] Refused, this run has already run enough actions')
                    return { content: [{ type: 'text', text: `This run has already performed ${MAX_CONFIGURED_TOOL_CALLS} actions, which is the limit. Do not try again; say what is left undone.` }] }
                }
                const { data, error } = await tryCatch(() => runPieceTool({ toolName: configured.toolName, instruction, piece: configured.pieceMetadata }))
                if (error) {
                    const reachedTheServer = String(error).includes('handler threw')
                    log.warn({ error, tool: { name: configured.toolName }, reachedTheServer }, '[configuredPieceTool] Action did not return a result')
                    return { content: [{ type: 'text', text: reachedTheServer
                        ? `That action failed, and this is not a connection problem: ${apErrorOf(error)?.message ?? String(error)}`
                        : `That action was sent but did not report back in time, so it may already have run. Do not call it again. Tell the user it needs checking. (${String(error)})` }] }
                }
                const succeeded = isSuccessResult(data.result)
                taintState.tainted = true
                if (!agentToolClassification.isReadOnlyActionCall({ actionName: configured.pieceMetadata.actionName, input: data.resolvedInput ?? {} })) {
                    eventEmitter.emitActionReceipt({
                        toolCallId: options.toolCallId,
                        actionDisplayName: data.actionDisplayName ?? configured.pieceMetadata.actionName,
                        pieceName: configured.pieceMetadata.pieceName,
                        ...spreadIfDefined('connectionLabel', data.connectionLabel),
                        status: succeeded ? 'success' : 'failed',
                        output: data.result,
                        timestamp: new Date().toISOString(),
                    })
                }
                if (!succeeded) {
                    log.warn({ tool: { name: configured.toolName } }, '[configuredPieceTool] Action reported a failure')
                    return { content: [{ type: 'text', text: `That action failed: ${extractUserFacingError({ result: data.result })}` }] }
                }
                return truncateLargeResult(data.result)
            },
        }),
    ]))
}

export function createConfiguredKnowledgeBaseTools({ tools, runKnowledgeBaseTool, taintState, log }: {
    tools: AgentKnowledgeBaseTool[]
    runKnowledgeBaseTool: (input: { toolName: string, knowledgeBaseFileId: string, query: string }) => Promise<{ result: unknown }>
    taintState: TaintState
    log: FastifyBaseLogger
}): ToolSet {
    let callsMade = 0
    return Object.fromEntries(tools
        .filter((configured) => configured.sourceType === KnowledgeBaseSourceType.FILE)
        .map((configured) => [
            configured.toolName,
            tool({
                description: `Search the "${configured.sourceName}" knowledge base file for relevant information. Use this when you need facts, policies, or content from this document.`,
                inputSchema: z.object({
                    query: z.string().describe('The search query to find relevant information'),
                }),
                execute: async ({ query }) => {
                    callsMade += 1
                    if (callsMade > MAX_CONFIGURED_TOOL_CALLS) {
                        log.warn({ tool: { name: configured.toolName }, callsMade }, '[configuredKnowledgeBaseTool] Refused, this run has already searched enough')
                        return { content: [{ type: 'text', text: `This run has already searched knowledge bases ${MAX_CONFIGURED_TOOL_CALLS} times, which is the limit. Do not try again; say what is left undone.` }] }
                    }
                    const { data, error } = await tryCatch(() => runKnowledgeBaseTool({ toolName: configured.toolName, knowledgeBaseFileId: configured.sourceId, query }))
                    taintState.tainted = true
                    if (error) {
                        log.warn({ error, tool: { name: configured.toolName } }, '[configuredKnowledgeBaseTool] Search did not return a result')
                        return { content: [{ type: 'text', text: `That search failed: ${String(error)}` }] }
                    }
                    return truncateLargeResult(data.result)
                },
            }),
        ]))
}

const jsonSchema7Shape = z.custom<JSONSchema7>()

export function createConfiguredFlowTools({ tools, runFlowTool, taintState, log }: {
    tools: ResolvedAgentFlowTool[]
    runFlowTool: (input: { toolName: string, flowId: string, flowVersionId?: string, returnsResponse: boolean, toolInput: Record<string, unknown> }) => Promise<{ result: unknown }>
    taintState: TaintState
    log: FastifyBaseLogger
}): ToolSet {
    let callsMade = 0
    return Object.fromEntries(tools.map((configured) => [
        configured.toolName,
        tool({
            description: configured.description,
            inputSchema: jsonSchema(jsonSchema7Shape.parse(configured.inputSchema)),
            execute: async (toolInput) => {
                callsMade += 1
                if (callsMade > MAX_CONFIGURED_TOOL_CALLS) {
                    log.warn({ tool: { name: configured.toolName }, callsMade }, '[configuredFlowTool] Refused, this run has already run enough actions')
                    return { content: [{ type: 'text', text: `This run has already performed ${MAX_CONFIGURED_TOOL_CALLS} actions, which is the limit. Do not try again; say what is left undone.` }] }
                }
                const { data, error } = await tryCatch(() => runFlowTool({ toolName: configured.toolName, flowId: configured.flowId, ...spreadIfDefined('flowVersionId', configured.flowVersionId), returnsResponse: configured.returnsResponse, toolInput }))
                taintState.tainted = true
                if (error) {
                    const reachedTheServer = String(error).includes('handler threw')
                    log.warn({ error, tool: { name: configured.toolName }, flow: { id: configured.flowId }, reachedTheServer }, '[configuredFlowTool] Flow did not return a result')
                    return { content: [{ type: 'text', text: reachedTheServer
                        ? `That flow failed: ${String(error)}`
                        : `That flow was called but did not report back in time, so it may already have run. Do not call it again. Tell the user it needs checking. (${String(error)})` }] }
                }
                if (!isSuccessResult(data.result)) {
                    log.warn({ tool: { name: configured.toolName }, flow: { id: configured.flowId } }, '[configuredFlowTool] Flow reported a failure')
                    return { content: [{ type: 'text', text: `That flow failed: ${extractUserFacingError({ result: data.result })}` }] }
                }
                return truncateLargeResult(data.result)
            },
        }),
    ]))
}

// Per-turn flag, set once the turn reads untrusted external content; forces the action-preview gate.
