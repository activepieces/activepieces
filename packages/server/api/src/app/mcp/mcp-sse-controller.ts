import { ALL_PRINCIPAL_TYPES, ApId } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpServer } from './mcp-server'
import { mcpService } from './mcp-service'

export const mcpSseController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id/sse', SSERequest, async (req, reply) => {
        try {
            const token = req.params.id
            const mcp = await mcpService(req.log).getByToken({ token })
            const { server } = await createMcpServer({
                mcpId: mcp.id,
                logger: req.log,
            })
            const transport = new StreamableHTTPServerTransport({
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
    })

    app.get('/:id/sse', async (req, reply) => {
        reply.raw.writeHead(405).end(JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        }))
    })

    app.delete('/:id/sse', async (req, reply) => {
        reply.raw.writeHead(405).end(JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        }))
    })
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