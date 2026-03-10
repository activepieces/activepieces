import { securityAccess } from '@activepieces/server-common'
import { ALL_OAUTH_SCOPES } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { domainHelper } from '../../ee/custom-domains/domain-helper'

export const oauthMetadataController: FastifyPluginAsyncZod = async (app) => {

    app.get('/.well-known/oauth-authorization-server', WellKnownRequest, async (_req) => {
        const apiUrl = await domainHelper.getPublicApiUrl({ path: '' })
        const issuer = `${apiUrl}/v1/oauth`
        return {
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            registration_endpoint: `${issuer}/register`,
            revocation_endpoint: `${issuer}/revoke`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            code_challenge_methods_supported: ['S256'],
            scopes_supported: ALL_OAUTH_SCOPES,
            token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
            client_id_metadata_document_supported: true,
        }
    })

    app.get('/.well-known/oauth-protected-resource/api/v1/mcp', ProtectedResourceRequest, async (_req) => {
        const apiUrl = await domainHelper.getPublicApiUrl({ path: '' })
        const resource = `${apiUrl}/v1/mcp`
        const issuer = `${apiUrl}/v1/oauth`
        return {
            resource,
            authorization_servers: [issuer],
            scopes_supported: ALL_OAUTH_SCOPES,
            bearer_methods_supported: ['header'],
        }
    })
}

const WellKnownRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['oauth'],
        description: 'OAuth 2.1 Authorization Server Metadata (RFC 8414)',
    },
}

const ProtectedResourceRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['oauth'],
        description: 'OAuth 2.1 Protected Resource Metadata (RFC 9728)',
    },
}
