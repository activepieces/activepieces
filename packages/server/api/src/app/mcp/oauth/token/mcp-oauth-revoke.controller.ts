import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthClientAuth } from '../client/mcp-oauth-client-auth'
import { mcpOAuthTokenService } from './mcp-oauth-token.service'

export const mcpOAuthRevokeController: FastifyPluginAsyncZod = async (app) => {

    app.post('/revoke', RevokeRequest, async (req, reply) => {
        const { token, token_type_hint } = req.body
        const result = await mcpOAuthClientAuth.authenticate({
            authorizationHeader: req.headers.authorization,
            clientId: req.body.client_id,
            clientSecret: req.body.client_secret,
        })
        if (result.status === 'error') {
            return reply.status(400).send(result.payload)
        }
        if (result.status === 'anonymous') {
            return reply.status(400).send({ error: 'invalid_client', error_description: 'Missing client_id' })
        }

        if (token_type_hint === 'refresh_token' || !token_type_hint) {
            await mcpOAuthTokenService.revokeRefreshToken({ refreshToken: token, clientId: result.client.clientId })
        }
        return reply.status(200).send()
    })
}

const RevokeRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: z.object({
            token: z.string().max(512),
            client_id: z.string().optional(),
            client_secret: z.string().optional(),
            token_type_hint: z.string().optional(),
        }),
    },
}
