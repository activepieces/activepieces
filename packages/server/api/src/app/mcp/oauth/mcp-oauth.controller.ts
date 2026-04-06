import { isNil } from '@activepieces/shared'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { mcpServerRepository, mcpServerService } from '../mcp-service'
import { mcpOAuthTokenService } from './token/mcp-oauth-token.service'

export const mcpOAuthHttpController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', McpEndpointConfig, async (_req, reply) => {
        return reply.status(405).send({
            error: 'Method Not Allowed',
            message: 'Use POST with Authorization: Bearer <token> for MCP requests.',
        })
    })

    app.post('/', McpEndpointConfig, async (req, reply) => {
        const authHeader = req.headers.authorization
        const [type, token] = authHeader?.split(' ') ?? []

        if (type !== 'Bearer' || isNil(token)) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Authorization: Bearer <token> required',
            })
        }

        const projectId = await resolveProjectId(token, req.log)
        if (isNil(projectId)) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid or expired access token',
            })
        }

        const mcp = await mcpServerService(req.log).getPopulatedByProjectId(projectId)
        const { server } = await mcpServerService(req.log).buildServer({ mcp })

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

async function resolveProjectId(token: string, log: FastifyBaseLogger): Promise<string | null> {
    if (token.split('.').length === 3) {
        try {
            const payload = await mcpOAuthTokenService.verifyAccessToken(token)
            return payload.projectId
        }
        catch (e) {
            log.debug({ err: e }, 'JWT verification failed')
            return null
        }
    }

    const mcpServer = await mcpServerRepository().findOneBy({ token })
    if (!isNil(mcpServer)) {
        return mcpServer.projectId
    }

    return null
}

const McpEndpointConfig = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
