import { isNil } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthClientService } from '../client/mcp-oauth-client.service'
import { mcpOAuthTokenService } from './mcp-oauth-token.service'

export const mcpOAuthRevokeController: FastifyPluginAsyncZod = async (app) => {

    app.post('/revoke', RevokeRequest, async (req, reply) => {
        const { token, client_id, client_secret, token_type_hint } = req.body

        if (client_id) {
            const client = await mcpOAuthClientService.getByClientId(client_id)
            if (isNil(client)) {
                return reply.status(400).send({ error: 'invalid_client' })
            }
            if (client.tokenEndpointAuthMethod === 'client_secret_post') {
                if (!client_secret || !mcpOAuthClientService.validateClientSecret(client, client_secret)) {
                    return reply.status(400).send({ error: 'invalid_client', error_description: 'Invalid client secret' })
                }
            }
        }

        if (token_type_hint === 'refresh_token' || !token_type_hint) {
            await mcpOAuthTokenService.revokeRefreshToken(token, client_id)
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
