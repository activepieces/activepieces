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
            const payload = result.errorDescription
                ? { error: result.error, error_description: result.errorDescription }
                : { error: result.error }
            return reply.status(400).send(payload)
        }

        const clientId = result.status === 'authenticated' ? result.client.clientId : undefined
        if (token_type_hint === 'refresh_token' || !token_type_hint) {
            await mcpOAuthTokenService.revokeRefreshToken(token, clientId)
        }
        // Per RFC 7009, return 200 even if token is invalid or unrecognized
        return reply.status(200).send()
    })
}

const RevokeRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: z.object({
            token: z.string(),
            client_id: z.string().optional(),
            client_secret: z.string().optional(),
            token_type_hint: z.string().optional(),
        }),
    },
}
