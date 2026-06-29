import { ZodRawShape } from 'zod'
import { ProjectSession } from '../session'

/**
 * Claude Agent SDK provider (`@anthropic-ai/claude-agent-sdk`). Builds an in-process MCP
 * server from the session's meta-tools so an agent can call them directly.
 *
 * The agent SDK's `tool` and `createSdkMcpServer` are injected rather than imported, so
 * `@activepieces/sdk` never takes a hard dependency on the agent SDK — the caller passes
 * them in:
 *
 * ```ts
 * import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
 * const { mcpServer, toolNames } = toClaudeAgentServer(session, { tool, createSdkMcpServer })
 * query({ prompt, options: { mcpServers: { activepieces: mcpServer }, allowedTools: toolNames } })
 * ```
 */
export function toClaudeAgentServer<TServer, TTool>(
    session: ProjectSession,
    deps: ClaudeAgentDeps<TServer, TTool>,
    options: ClaudeAgentOptions = {},
): ClaudeAgentServer<TServer> {
    const serverName = options.name ?? 'activepieces'
    const tools = session.tools()
    const definitions = tools.map((tool) => deps.tool(tool.name, tool.description, tool.inputSchema, async (args) => {
        try {
            const result = await tool.execute(args)
            return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] }
        }
        catch (error) {
            return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true }
        }
    }))
    return {
        mcpServer: deps.createSdkMcpServer({ name: serverName, version: options.version ?? '0.1.0', tools: definitions }),
        toolNames: tools.map((tool) => `mcp__${serverName}__${tool.name}`),
    }
}

type McpToolHandler = (
    args: Record<string, unknown>,
    extra: unknown,
) => Promise<{ content: Array<{ type: 'text', text: string }>, isError?: boolean }>

type ClaudeAgentDeps<TServer, TTool> = {
    tool: (name: string, description: string, inputSchema: ZodRawShape, handler: McpToolHandler) => TTool
    createSdkMcpServer: (options: { name: string, version?: string, tools: TTool[] }) => TServer
}

type ClaudeAgentOptions = {
    name?: string
    version?: string
}

type ClaudeAgentServer<TServer> = {
    mcpServer: TServer
    toolNames: string[]
}
