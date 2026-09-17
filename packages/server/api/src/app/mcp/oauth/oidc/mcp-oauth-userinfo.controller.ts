import { isNil } from '@activepieces/core-utils'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthTokenService } from '../token/mcp-oauth-token.service'
import { mcpOidc } from './mcp-oidc'

export const mcpOAuthUserInfoController: FastifyPluginAsyncZod = async (app) => {
    app.get('/userinfo', UserInfoRequest, handleUserInfo)
    app.post('/userinfo', UserInfoRequest, handleUserInfo)
}

async function handleUserInfo(req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    void reply.header('Cache-Control', 'no-store').header('Access-Control-Allow-Origin', '*')

    const [type, token] = req.headers.authorization?.split(' ') ?? []
    if (type !== 'Bearer' || isNil(token)) {
        return reply.status(401).header('WWW-Authenticate', 'Bearer').send({
            error: 'invalid_request',
            message: 'Authorization: Bearer <token> required',
        })
    }

    const authenticated = await mcpOAuthTokenService.authenticate(token)
    if (authenticated.status === 'unavailable') {
        req.log.error({ error: authenticated.error }, 'Could not read the MCP OAuth revocation list')
        return reply.status(503).header('Retry-After', '1').send({
            error: 'temporarily_unavailable',
            message: 'Could not verify the access token right now, retry shortly.',
        })
    }
    if (authenticated.status === 'invalid') {
        req.log.debug({ error: authenticated.error }, 'Userinfo token verification failed')
        return reply.status(401).header('WWW-Authenticate', 'Bearer error="invalid_token"').send({
            error: 'invalid_token',
            message: 'Invalid or expired access token',
        })
    }

    const { payload } = authenticated
    const claims = await mcpOidc.getUserInfo({
        userId: payload.sub,
        platformId: payload.platformId,
        scopes: payload.scopes ?? [],
    })
    if (isNil(claims)) {
        return reply.status(401).header('WWW-Authenticate', 'Bearer error="invalid_token"').send({
            error: 'invalid_token',
            message: 'Invalid or expired access token',
        })
    }
    return reply.status(200).send(claims)
}

const UserInfoRequest = {
    config: { security: securityAccess.public() },
    schema: { hide: true },
}
