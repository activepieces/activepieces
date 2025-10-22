import { ALL_PRINCIPAL_TYPES, ApId } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { mcpService } from '../mcp-service'
import { createMcpServer } from './mcp-server'
import { mcpSessionManager } from './mcp-session-manager'

const HEARTBEAT_INTERVAL = 30 * 1000 // 30 seconds

export const mcpSseController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:token/sse', SSERequest, async (req, reply) => {
        const token = req.params.token
        const mcp = await mcpService(req.log).getByToken({
            token,
        })
        await handleSSERequest(reply, mcp.id, mcp.projectId, req.log)
    })

    app.post('/:token/sse', SSERequest, async (req, reply) => {
        const token = req.params.token
        const mcp = await mcpService(req.log).getByToken({
            token,
        })

        await handleStreamableHttpRequest(req, reply, mcp.id, mcp.projectId, req.log)
    })

    app.post('/messages', MessagesRequest, async (req, reply) => {
        const sessionId = req.query?.sessionId as string

        if (!sessionId) {
            await reply.code(400).send({ message: 'Missing session ID' })
            return
        }
        await mcpSessionManager(req.log).publish(sessionId, req.body, 'message')
        await reply.code(202).send()
    })
}

async function handleStreamableHttpRequest(
    req: FastifyRequest,
    reply: FastifyReply,
    mcpId: string,
    projectId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    try {
        const { server } = await createMcpServer({
            mcpId,
            logger,
            projectId,
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
        logger.error({ 
            error,
        }, 'Error handling MCP request')
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
}

async function handleSSERequest(
    reply: FastifyReply,
    mcpId: string,
    projectId: string,
    logger: FastifyBaseLogger,
): Promise<void> {
    const transport = new SSEServerTransport('/api/v1/mcp/messages', reply.raw)
    const { server } = await createMcpServer({
        mcpId,
        projectId,
        logger,
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
}

const MessagesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: Type.Object({
            sessionId: Type.Optional(Type.String()),
        }),
    },
}

const SSERequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            token: ApId,
        }),
    },
} 