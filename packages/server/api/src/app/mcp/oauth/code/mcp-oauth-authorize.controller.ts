import { isNil } from '@activepieces/core-utils'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { domainHelper } from '../../../helper/domain-helper'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { mcpOAuthClientService } from '../client/mcp-oauth-client.service'
import { mcpOAuthValidation } from '../mcp-oauth-validation'

const AUTH_REQUEST_TTL_10_MINUTES_SECONDS = 10 * 60

export const mcpOAuthAuthorizeController: FastifyPluginAsyncZod = async (app) => {

    app.get('/authorize', AuthorizeRequest, async (req, reply) => {
        const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state, scope, resource } = req.query

        if (response_type !== 'code') {
            return reply.status(400).send({ error: 'unsupported_response_type' })
        }

        if (code_challenge_method !== 'S256') {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Only S256 code challenge method is supported' })
        }

        const client = await mcpOAuthClientService.getByClientId(client_id)
        if (isNil(client)) {
            return reply.status(400).send({ error: 'invalid_client', error_description: 'Unknown client_id' })
        }

        if (!mcpOAuthClientService.validateRedirectUri(client, redirect_uri)) {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid redirect_uri' })
        }

        const key = await jwtUtils.getJwtSecret()
        const authRequestToken = await jwtUtils.sign({
            payload: {
                clientId: client_id,
                clientName: client.clientName ?? 'Unknown app',
                redirectUri: redirect_uri,
                codeChallenge: code_challenge,
                codeChallengeMethod: code_challenge_method,
                state: state ?? null,
                scopes: scope ? scope.split(' ') : ['mcp'],
                resource: resource ?? null,
                type: 'mcp_auth_request',
            },
            key,
            expiresInSeconds: AUTH_REQUEST_TTL_10_MINUTES_SECONDS,
            audience: JwtAudience.MCP_OAUTH_AUTH_REQUEST,
        })

        const authorizePageUrl = new URL(domainHelper.getPublicUrlFromRequest({ req, path: '/mcp-authorize' }))
        authorizePageUrl.searchParams.set('authRequestId', authRequestToken)

        return reply.redirect(authorizePageUrl.toString())
    })
}

const AuthorizeRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        querystring: z.object({
            client_id: z.string().max(64),
            redirect_uri: z.string().max(2048),
            response_type: z.string().max(64),
            code_challenge: mcpOAuthValidation.storableText(256).refine((value) => value.length >= 43, { message: 'code_challenge is too short' }),
            code_challenge_method: z.string().max(8).default('S256'),
            state: mcpOAuthValidation.storableText(512).optional(),
            scope: mcpOAuthValidation.storableText(512).optional(),
            resource: mcpOAuthValidation.storableText(2048).optional(),
        }),
    },
}
