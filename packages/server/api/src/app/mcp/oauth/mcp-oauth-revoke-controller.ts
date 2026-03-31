import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { mcpOAuthTokenService } from './mcp-oauth-token-service'

export const mcpOAuthRevokeController: FastifyPluginAsyncZod = async (app) => {

    app.post('/revoke', RevokeRequest, async (req, reply) => {
        const { token, token_type_hint } = req.body

        if (token_type_hint === 'refresh_token' || !token_type_hint) {
            await mcpOAuthTokenService.revokeRefreshToken(token)
        }
        // Access tokens are JWTs — revocation is a no-op (they expire in 15min)
        // Per RFC 7009, return 200 even if token is invalid
        return reply.status(200).send()
    })
}

const RevokeRequest = {
    config: { security: securityAccess.public(), skipAuth: true },
    schema: {
        hide: true,
        body: z.object({
            token: z.string(),
            token_type_hint: z.string().optional(),
        }),
    },
}
