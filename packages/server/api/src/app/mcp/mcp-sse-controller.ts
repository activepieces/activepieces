import { ALL_PRINCIPAL_TYPES, ApId } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { createMcpServer } from './mcp-server'
import { mcpService } from './mcp-service'
import { mcpSessionManager } from './mcp-session-manager'
import { randomUUID } from 'crypto'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyReply, FastifyRequest } from 'fastify'


export const mcpSseController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id/sse', SSERequest, async (req, reply) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined
        let transport: StreamableHTTPServerTransport

        const hasTransport = sessionId ? await mcpSessionManager(req.log).hasTransport(sessionId) : false

        if (sessionId && hasTransport) {
            transport = await mcpSessionManager(req.log).get(sessionId)
        }
        else if (!sessionId && isInitializeRequest(req.body)) {
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: async (sessionId) => {
                    await mcpSessionManager(req.log).add(sessionId, transport)
                }
            })

            transport.onclose = async () => {
                if (transport.sessionId) {
                    req.log.info(`Connection closed for session ${transport.sessionId}`)
                    await mcpSessionManager(req.log).publish(transport.sessionId)
                }
            }

            const token = req.params.id
            const mcp = await mcpService(req.log).getByToken({ token })
            const { server } = await createMcpServer({
                mcpId: mcp.id,
                logger: req.log,
            })

            await server.connect(transport)
        }
        else {
            reply.status(400).send({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            })
            return
        }
        await transport.handleRequest(req.raw, reply.raw, req.body)
    })

    const handleSessionRequest = async (req: FastifyRequest, reply: FastifyReply) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined
        if (!sessionId) {
            reply.status(400).send('Missing session ID')
            return
        }

        if (!await mcpSessionManager(req.log).hasTransport(sessionId)) {
            reply.status(400).send('Invalid session ID')
            return
        }
        const transport = await mcpSessionManager(req.log).get(sessionId)
        await transport.handleRequest(req.raw, reply.raw, req.body)
    }
      
    app.get('/:id/sse', handleSessionRequest)
    app.delete('/:id/sse', handleSessionRequest)
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