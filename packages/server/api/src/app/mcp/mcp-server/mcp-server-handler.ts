import { McpTool } from '@activepieces/shared'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { createMcpServer } from './mcp-server'
import { mcpSessionManager } from './mcp-session-manager'

const HEARTBEAT_INTERVAL = 30 * 1000

export const mcpServerHandler = {
    async handleStreamableHttpRequest({ req, reply, projectId, tools, logger }: HandleStreamableHttpRequestParams): Promise<void> {
        try {
            const { server } = await createMcpServer({
                logger,
                projectId,
                tools,
            })

            const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            })
    
            reply.raw.on('close', async () => {
                await transport.close()
                await server.close()
            })
    
            await server.connect(transport)
            await transport.handleRequest(req.raw, reply.raw, req.body)
        }
        catch (error) {
            logger.error(`Error handling MCP request: ${error}`)
            if (!reply.raw.headersSent) {
                await reply.status(500).send({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error',
                    },
                    id: null,
                })
            }
        }
    },
    
    async handleSSERequest({ reply, projectId, tools, logger }: HandleSSERequestParams): Promise<void> {
        const transport = new SSEServerTransport('/api/v1/mcp/messages', reply.raw)
        const { server } = await createMcpServer({
            projectId,
            logger,
            tools,
        })
    
        await mcpSessionManager(logger).add(transport.sessionId, server, transport)
        await server.connect(transport)
    
        const heartbeatInterval = setInterval(() => {
            void reply.raw.write(': heartbeat\n\n')
            logger.info(`Heartbeat sent for session ${transport.sessionId}`)
        }, HEARTBEAT_INTERVAL)
    
        reply.raw.on('close', async () => {
            clearInterval(heartbeatInterval)
            logger.info(`Connection closed for session ${transport.sessionId}`)
            await mcpSessionManager(logger).publish(transport.sessionId, {}, 'remove')
        })
        reply.raw.end()
    },
}

type HandleStreamableHttpRequestParams = {
    req: FastifyRequest
    reply: FastifyReply
    projectId: string
    logger: FastifyBaseLogger
    tools: McpTool[]
}

type HandleSSERequestParams = {
    reply: FastifyReply
    projectId: string
    logger: FastifyBaseLogger
    tools: McpTool[]
}