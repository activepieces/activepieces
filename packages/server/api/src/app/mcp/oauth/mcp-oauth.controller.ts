import { isNil, PopulatedMcpServer, TelemetryEventName } from '@activepieces/shared'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { telemetry } from '../../helper/telemetry.utils'
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

        const identity = await resolveIdentity(token, req.log)
        if (isNil(identity)) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid or expired access token',
            })
        }

        rejectedPromiseHandler(telemetry(req.log).trackProject(identity.projectId, {
            name: TelemetryEventName.MCP_SERVER_CONNECTED,
            payload: {
                authMethod: identity.authMethod,
                projectId: identity.projectId,
                userId: identity.userId,
            },
        }), req.log)

        let mcp: PopulatedMcpServer
        try {
            mcp = await mcpServerService(req.log).getPopulatedByProjectId(identity.projectId)
        }
        catch (err) {
            req.log.debug({ err }, 'Failed to resolve MCP server for project')
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid project or token.',
            })
        }
        const { server } = await mcpServerService(req.log).buildServer({ mcp, userId: identity.userId })

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

async function resolveIdentity(token: string, log: FastifyBaseLogger): Promise<ResolvedIdentity | null> {
    if (token.split('.').length === 3) {
        try {
            const payload = await mcpOAuthTokenService.verifyAccessToken(token)
            return { projectId: payload.projectId, authMethod: 'oauth', userId: payload.sub }
        }
        catch (e) {
            log.debug({ err: e }, 'JWT verification failed')
            return null
        }
    }

    const mcpServer = await mcpServerRepository().findOneBy({ token })
    if (!isNil(mcpServer)) {
        return { projectId: mcpServer.projectId, authMethod: 'oauth_project_token_fallback' }
    }

    return null
}

type ResolvedIdentity = {
    projectId: string
    authMethod: 'oauth' | 'oauth_project_token_fallback'
    userId?: string
}

const McpEndpointConfig = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
