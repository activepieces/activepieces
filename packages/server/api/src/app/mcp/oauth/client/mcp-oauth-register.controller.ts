import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthClientService } from './mcp-oauth-client.service'

export const mcpOAuthRegisterController: FastifyPluginAsyncZod = async (app) => {

    app.post('/register', RegisterRequest, async (req, reply) => {
        const { redirect_uris, client_name, grant_types, token_endpoint_auth_method } = req.body

        const result = await mcpOAuthClientService.register({
            redirectUris: redirect_uris,
            clientName: client_name,
            grantTypes: grant_types,
            tokenEndpointAuthMethod: token_endpoint_auth_method,
        })

        return reply.status(201).send(result)
    })
}

const RegisterRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: z.object({
            redirect_uris: z.array(z.string().url().refine((uri) => {
                const scheme = new URL(uri).protocol
                return scheme === 'http:' || scheme === 'https:'
            }, { message: 'Only http and https redirect URIs are allowed' })).min(1),
            client_name: z.string().max(255).optional(),
            grant_types: z.array(z.string()).optional(),
            response_types: z.array(z.string()).optional(),
            token_endpoint_auth_method: z.enum(['none', 'client_secret_post']).optional(),
        }),
    },
}
