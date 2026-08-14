import { tryCatchSync } from '@activepieces/core-utils'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthValidation } from '../mcp-oauth-validation'
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

        return reply
            .status(201)
            .header('Cache-Control', 'no-store')
            .header('Pragma', 'no-cache')
            .send(result)
    })
}

function isPrivateUseScheme(protocol: string): boolean {
    const scheme = protocol.replace(/:$/, '')
    return /^[a-z][a-z0-9+\-.]*\.[a-z][a-z0-9+\-.]*$/.test(scheme)
        || ['cursor', 'vscode', 'vscode-insiders', 'windsurf', 'claude'].includes(scheme)
}

function isAllowedRedirectUri(uri: string): boolean {
    const parsed = tryCatchSync(() => new URL(uri))
    if (parsed.error) {
        return false
    }
    const scheme = parsed.data.protocol
    return scheme === 'http:' || scheme === 'https:' || isPrivateUseScheme(scheme)
}

const metadataToken = mcpOAuthValidation.storableText(64)

const RegisterRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: z.object({
            redirect_uris: z.array(
                mcpOAuthValidation.storableText(2048)
                    .refine(isAllowedRedirectUri, { message: 'Only http, https, or private-use URI schemes (RFC 8252) are allowed' }),
            ).min(1).max(32),
            client_name: mcpOAuthValidation.storableText(255).optional(),
            grant_types: z.array(metadataToken).max(16).optional(),
            response_types: z.array(metadataToken).max(16).optional(),
            token_endpoint_auth_method: z.enum(['none', 'client_secret_post', 'client_secret_basic']).optional(),
        }),
    },
}
