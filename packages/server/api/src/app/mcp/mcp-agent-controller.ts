import { isNil } from '@activepieces/shared'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { projectService } from '../project/project-service'
import { mcpServerRepository, mcpServerService } from './mcp-service'

/**
 * Internal MCP HTTP endpoint for the chat agent.
 * Authenticates via raw MCP server token (Bearer header).
 * Does NOT expose OAuth metadata so Claude Code won't try the OAuth flow.
 */
export const mcpAgentController: FastifyPluginAsyncZod = async (app) => {

    app.addContentTypeParser(
        'application/json',
        { parseAs: 'string' },
        (_req, body: string, done) => {
            if (body == null || body.trim() === '') {
                return done(null, {})
            }
            try {
                done(null, JSON.parse(body))
            }
            catch (err) {
                const error: Error & { statusCode?: number } = err instanceof Error ? err : new Error('JSON parsing failed')
                error.statusCode = 400
                done(error, undefined)
            }
        },
    )

    app.post('/', AgentEndpointConfig, async (req, reply) => {
        const authHeader = req.headers.authorization
        const [type, token] = authHeader?.split(' ') ?? []

        if (type !== 'Bearer' || isNil(token)) {
            return reply.status(401).send({ error: 'unauthorized' })
        }

        const mcpServer = await mcpServerRepository().findOneBy({ token })
        if (isNil(mcpServer)) {
            return reply.status(401).send({ error: 'unauthorized' })
        }

        const project = await projectService(req.log).getOneOrThrow(mcpServer.projectId)
        const mcp = await mcpServerService(req.log).getPopulatedByProjectId(mcpServer.projectId)
        const { server } = await mcpServerService(req.log).buildServer({ mcp, userId: project.ownerId })

        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        })

        reply.raw.on('close', async () => {
            await transport.close()
            await server.close()
        })

        await server.connect(transport)
        await transport.handleRequest(req.raw, reply.raw, req.body)
    })
}

const AgentEndpointConfig = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
