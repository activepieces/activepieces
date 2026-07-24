import { isNil } from '@activepieces/core-utils'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthClientAuth } from '../client/mcp-oauth-client-auth'
import { mcpOAuthClientService } from '../client/mcp-oauth-client.service'
import { mcpOAuthTokenService } from './mcp-oauth-token.service'

export const mcpOAuthRevokeController: FastifyPluginAsyncZod = async (app) => {

    app.post('/revoke', RevokeRequest, async (req, reply) => {
        const { token, token_type_hint } = req.body
        const { clientId, clientSecret } = mcpOAuthClientAuth.extractCredentials({
            authorizationHeader: req.headers.authorization,
            clientId: req.body.client_id,
            clientSecret: req.body.client_secret,
        })

        if (clientId) {
            const client = await mcpOAuthClientService.getByClientId(clientId)
            if (isNil(client)) {
                return reply.status(400).send({ error: 'invalid_client' })
            }
            if (mcpOAuthClientAuth.requiresClientSecret(client)) {
                if (!clientSecret || !mcpOAuthClientService.validateClientSecret(client, clientSecret)) {
                    return reply.status(400).send({ error: 'invalid_client', error_description: 'Invalid client secret' })
                }
            }
        }

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
