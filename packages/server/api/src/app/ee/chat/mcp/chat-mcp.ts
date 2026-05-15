import { apId, isNil, tryCatch } from '@activepieces/shared'
import { createMCPClient } from '@ai-sdk/mcp'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { mcpOAuthTokenService } from '../../../mcp/oauth/token/mcp-oauth-token.service'
import { chatApprovalGate } from '../chat-approval-gate'
import { chatToolCategories } from '../tools/chat-tool-categories'

type StreamWriter = {
    write(part: Record<string, unknown>): void
}

async function getMcpCredentials({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<McpCredentials> {
    const { data: accessToken, error } = await tryCatch(() =>
        mcpOAuthTokenService.issueInternalAccessToken({ userId, platformId, projectId: null }),
    )
    if (error) {
        log.warn({ err: error, platformId }, 'Failed to get MCP credentials — chat will work without MCP tools')
        return { mcpServerUrl: null, mcpToken: null }
    }
    const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    return {
        mcpServerUrl: `${frontendUrl}/mcp/platform`,
        mcpToken: accessToken,
    }
}

async function connectMcpClient({ mcpCredentials, log }: {
    mcpCredentials: McpCredentials
    log: FastifyBaseLogger
}): Promise<McpConnection> {
    const { mcpServerUrl, mcpToken } = mcpCredentials
    if (isNil(mcpServerUrl) || isNil(mcpToken)) {
        return { mcpClient: null, mcpToolSet: {} }
    }
    const { data: client, error } = await tryCatch(async () => createMCPClient({
        transport: {
            type: 'http',
            url: mcpServerUrl,
            headers: { 'Authorization': `Bearer ${mcpToken}` },
        },
    }))
    if (isNil(client)) {
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

function hasExecute(tool: object): tool is object & { execute: (args: unknown) => Promise<unknown> } {
    return 'execute' in tool && typeof tool.execute === 'function'
}

function withApprovalGates({ mcpToolSet, writer, log }: {
    mcpToolSet: Record<string, unknown>
    writer: StreamWriter
    log: FastifyBaseLogger
}): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [name, tool] of Object.entries(mcpToolSet)) {
        if (!chatToolCategories.requiresApproval(name) || typeof tool !== 'object' || tool === null || !hasExecute(tool)) {
            result[name] = tool
            continue
        }

        const originalExecute = tool.execute.bind(tool)
        result[name] = Object.assign({}, tool, {
            execute: async (args: unknown) => {
                const gateId = apId()
                const displayName = typeof args === 'object' && args !== null && 'displayName' in args && typeof args.displayName === 'string'
                    ? args.displayName
                    : humanizeToolName(name)

                writer.write({
                    type: 'data-approval-request',
                    data: { gateId, toolName: name, displayName },
                    transient: true,
                })

                log.info({ gateId, toolName: name }, 'Tool approval gate opened — waiting for user')
                const approved = await chatApprovalGate.waitForApproval({ gateId })

                if (!approved) {
                    log.info({ gateId, toolName: name }, 'Tool approval rejected or timed out')
                    return { content: [{ type: 'text', text: 'Action cancelled by user.' }] }
                }

                log.info({ gateId, toolName: name }, 'Tool approval granted — executing')
                return originalExecute(args)
            },
        })
    }

    return result
}

type McpCredentials = {
    mcpServerUrl: string | null
    mcpToken: string | null
}

type McpConnection = {
    mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null
    mcpToolSet: Record<string, unknown>
}

export const chatMcp = {
    getCredentials: getMcpCredentials,
    connectClient: connectMcpClient,
    withApprovalGates,
}
