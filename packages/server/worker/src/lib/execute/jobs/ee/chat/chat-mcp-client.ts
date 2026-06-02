import { tryCatch } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { FastifyBaseLogger } from 'fastify'
import { ChatEventEmitter } from './chat-worker-tools'

const CONVERSATION_ID_HEADER = 'x-ap-conversation-id'

const APPROVAL_REQUIRED_TOOL_NAMES = new Set([
    'ap_delete_flow',
    'ap_delete_table',
    'ap_delete_step',
    'ap_delete_branch',
    'ap_delete_records',
    'ap_run_action',
    'ap_test_step',
    'ap_test_flow',
    'ap_change_flow_status',
])

function requiresApproval(name: string): boolean {
    return APPROVAL_REQUIRED_TOOL_NAMES.has(name) || !name.startsWith('ap_')
}

async function connectMcpClient({ mcpCredentials, conversationId, log }: {
    mcpCredentials: { mcpServerUrl: string, mcpToken: string } | null
    conversationId: string
    log: FastifyBaseLogger
}): Promise<McpConnection> {
    if (!mcpCredentials) {
        return { mcpClient: null, mcpToolSet: {} }
    }

    const { mcpServerUrl, mcpToken } = mcpCredentials

    const { data: client, error } = await tryCatch(async () => createMCPClient({
        transport: {
            type: 'http',
            url: mcpServerUrl,
            headers: {
                'Authorization': `Bearer ${mcpToken}`,
                [CONVERSATION_ID_HEADER]: conversationId,
            },
        },
    }))

    if (!client) {
        log.warn({ err: error }, 'Failed to create MCP client — chat will work without MCP tools')
        return { mcpClient: null, mcpToolSet: {} }
    }

    const mcpToolSet = await client.tools()
    return { mcpClient: client, mcpToolSet }
}

function humanizeToolName(name: string): string {
    return name
        .replace(/^ap_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

function hasExecute(tool: object): tool is object & { execute: (args: unknown, options?: { toolCallId: string }) => Promise<unknown> } {
    return 'execute' in tool && typeof tool.execute === 'function'
}

function withApprovalGates({ mcpToolSet, eventEmitter, log, isApproved, waitForApproval }: {
    mcpToolSet: Record<string, unknown>
    eventEmitter: ChatEventEmitter
    log: FastifyBaseLogger
    isApproved: () => boolean
    waitForApproval: (params: { gateId: string, timeoutMs?: number }) => Promise<{ approved: boolean }>
}): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [name, tool] of Object.entries(mcpToolSet)) {
        if (typeof tool !== 'object' || tool === null || !hasExecute(tool)) {
            result[name] = tool
            continue
        }

        const originalExecute = tool.execute.bind(tool)
        const needsApproval = requiresApproval(name)

        result[name] = Object.assign({}, tool, {
            execute: async (args: unknown, options?: { toolCallId: string }) => {
                if (isApproved() || !needsApproval) {
                    return originalExecute(args, options)
                }
                const toolCallId = options?.toolCallId
                if (!toolCallId) {
                    return originalExecute(args, options)
                }
                const displayName = typeof args === 'object' && args !== null && 'displayName' in args && typeof args.displayName === 'string'
                    ? args.displayName
                    : humanizeToolName(name)

                eventEmitter.emitToolApprovalRequest({
                    toolCallId,
                    toolName: name,
                    displayName,
                })

                log.info({ toolCallId, toolName: name }, 'Tool approval gate opened')
                const decision = await waitForApproval({ gateId: toolCallId })

                if (!decision.approved) {
                    log.info({ toolCallId, toolName: name }, 'Tool approval rejected or timed out')
                    return { content: [{ type: 'text', text: 'Action cancelled by user.' }] }
                }

                log.info({ toolCallId, toolName: name }, 'Tool approval granted')
                return originalExecute(args, options)
            },
        })
    }

    return result
}

type McpConnection = {
    mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null
    mcpToolSet: Record<string, unknown>
}

export const chatMcpClient = {
    connect: connectMcpClient,
    withApprovalGates,
}
