import { isNil, McpServerType, PopulatedMcpServer, TelemetryEventName, tryCatch } from '@activepieces/shared'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { CONVERSATION_ID_HEADER } from '../../ee/chat/mcp/chat-mcp'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { telemetry } from '../../helper/telemetry.utils'
import { mcpServerService } from '../mcp-service'
import { mcpOAuthTokenService } from './token/mcp-oauth-token.service'

export const mcpOAuthHttpController: FastifyPluginAsyncZod = async (app) => {
    registerMcpEndpoint(app, McpServerType.PROJECT)
}

export const mcpPlatformHttpController: FastifyPluginAsyncZod = async (app) => {
    registerMcpEndpoint(app, McpServerType.PLATFORM)
}

function registerMcpEndpoint(app: Parameters<FastifyPluginAsyncZod>[0], scope: McpServerType): void {
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

        const identity = await resolveIdentity({ token, scope, log: req.log })
        if (isNil(identity)) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid or expired access token',
            })
        }

        const { mcp, userId } = await resolveMcpAndUser({ identity, log: req.log })
        if (isNil(mcp)) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid project or token.',
            })
        }

        const conversationId = req.headers[CONVERSATION_ID_HEADER] as string | undefined
        const selectionScope = conversationId ? { conversationId } : null
        const { server } = await mcpServerService(req.log).buildServer({ mcp, userId, selectionScope })

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

async function resolveIdentity({ token, scope, log }: { token: string, scope: McpServerType, log: FastifyBaseLogger }): Promise<ResolvedIdentity | null> {
    const { data: payload, error } = await tryCatch(() => mcpOAuthTokenService.verifyAccessToken(token))
    if (error) {
        log.debug({ err: error }, 'OAuth token verification failed')
        return null
    }
    const { projectId } = payload
    const isPlatformToken = isNil(projectId)
    if (isPlatformToken && scope === McpServerType.PLATFORM) {
        return { type: McpServerType.PLATFORM, platformId: payload.platformId, userId: payload.sub }
    }
    if (!isPlatformToken && scope === McpServerType.PROJECT) {
        return { type: McpServerType.PROJECT, projectId, userId: payload.sub }
    }
    return null
}

async function resolveMcpAndUser({ identity, log }: { identity: ResolvedIdentity, log: FastifyBaseLogger }): Promise<{ mcp: PopulatedMcpServer | null, userId: string | null }> {
    try {
        if (identity.type === McpServerType.PLATFORM) {
            rejectedPromiseHandler(telemetry(log).trackPlatform(identity.platformId, {
                name: TelemetryEventName.MCP_SERVER_CONNECTED,
                payload: {
                    platformId: identity.platformId,
                    userId: identity.userId,
                },
            }), log)
            const mcp = await mcpServerService(log).getPopulatedByPlatformId(identity.platformId)
            return { mcp, userId: identity.userId }
        }
        rejectedPromiseHandler(telemetry(log).trackProject(identity.projectId, {
            name: TelemetryEventName.MCP_SERVER_CONNECTED,
            payload: {
                projectId: identity.projectId,
                userId: identity.userId,
            },
        }), log)
        const mcp = await mcpServerService(log).getPopulatedByProjectId(identity.projectId)
        return { mcp, userId: identity.userId }
    }
    catch (err) {
        log.debug({ err }, 'Failed to resolve MCP server')
        return { mcp: null, userId: null }
    }
}

type ResolvedIdentity =
    | { type: McpServerType.PROJECT, projectId: string, userId: string }
    | { type: McpServerType.PLATFORM, platformId: string, userId: string }

const McpEndpointConfig = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
