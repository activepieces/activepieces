import { ALL_PRINCIPAL_TYPES, ApId } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { createMcpServer } from './mcp-server'
import { mcpService } from './mcp-service'
import { mcpSessionManager } from './mcp-session-manager'

const HEARTBEAT_INTERVAL = 30 * 1000 // 30 seconds

export const mcpSseController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/:id/sse', SSERequest, async (req, reply) => {
        const token = req.params.id
        const mcp = await mcpService(req.log).getByToken({
            token,
        })

        const { server, transport } = await createMcpServer({
            mcpId: mcp.id,
            reply,
            logger: req.log,
        })

        await mcpSessionManager(req.log).add(transport.sessionId, server, transport, mcp.id)

        await server.connect(transport)

        const heartbeatInterval = setInterval(() => {
            reply.raw.write(': heartbeat\n\n')
            req.log.info(`Heartbeat sent for session ${transport.sessionId}`)
        }, HEARTBEAT_INTERVAL)

        reply.raw.on('close', async () => {
            clearInterval(heartbeatInterval)
            req.log.info(`Connection closed for session ${transport.sessionId}`)
            await mcpSessionManager(req.log).publish(transport.sessionId, {}, 'remove')
        })
    })

    app.post('/messages', MessagesRequest, async (req, reply) => {
        const sessionId = req.query?.sessionId as string

        if (!sessionId) {
            await reply.code(400).send({ message: 'Missing session ID' })
            return
        }

        const body = req.body as { method: string, params: Record<string, unknown>}
        const mcpId = mcpSessionManager(req.log).getMcpId(sessionId)
        if(body.method === 'tools/call') {
            await mcpService(req.log).trackToolCall({
                mcpId: mcpId as ApId,
                toolName: body.params.name as string,
            })
        }

        await mcpSessionManager(req.log).publish(sessionId, req.body, 'message')
        await reply.code(202).send()
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
            id: ApId,
        }),
    },
} 