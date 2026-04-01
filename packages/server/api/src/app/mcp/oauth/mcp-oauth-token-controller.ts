import { isNil } from '@activepieces/shared'
import { FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { mcpOAuthClientService } from './mcp-oauth-client-service'
import { mcpOAuthCodeService } from './mcp-oauth-code-service'
import { mcpOAuthTokenService, OAuthTokenError } from './mcp-oauth-token-service'

export const mcpOAuthTokenController: FastifyPluginAsyncZod = async (app) => {

    app.post('/token', TokenRequest, async (req, reply) => {
        const { grant_type, client_id } = req.body

        try {
            if (grant_type === 'authorization_code') {
                return await handleAuthorizationCode(req.body, reply)
            }
            if (grant_type === 'refresh_token') {
                return await handleRefreshToken(req.body, reply)
            }
            return await reply.status(400).send({ error: 'unsupported_grant_type' })
        }
        catch (e) {
            if (e instanceof OAuthTokenError) {
                return reply.status(400).send({
                    error: e.errorCode,
                    error_description: e.errorDescription,
                })
            }
            req.log.error({ err: e, clientId: client_id }, 'OAuth token error')
            return reply.status(500).send({ error: 'server_error' })
        }
    })
}

async function handleAuthorizationCode(body: TokenRequestBody, reply: FastifyReply): Promise<void> {
    const { code, client_id, code_verifier, redirect_uri } = body
    if (!code || !client_id || !code_verifier) {
        await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing code, client_id, or code_verifier' })
        return
    }

    const client = await mcpOAuthClientService.getByClientId(client_id)
    if (isNil(client)) {
        await reply.status(400).send({ error: 'invalid_client' })
        return
    }

    if (client.tokenEndpointAuthMethod === 'client_secret_post') {
        if (!body.client_secret || !mcpOAuthClientService.validateClientSecret(client, body.client_secret)) {
            await reply.status(400).send({ error: 'invalid_client', error_description: 'Invalid client secret' })
            return
        }
    }

    const authCode = await mcpOAuthCodeService.consume(code, client_id, redirect_uri)
    if (isNil(authCode)) {
        await reply.status(400).send({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' })
        return
    }

    const tokens = await mcpOAuthTokenService.exchangeCode({
        codeVerifier: code_verifier,
        codeChallenge: authCode.codeChallenge,
        codeChallengeMethod: authCode.codeChallengeMethod,
        clientId: client_id,
        userId: authCode.userId,
        projectId: authCode.projectId,
        platformId: authCode.platformId,
        scopes: authCode.scopes ?? ['mcp'],
    })

    await reply.status(200).send(tokens)
}

async function handleRefreshToken(body: TokenRequestBody, reply: FastifyReply): Promise<void> {
    const { refresh_token, client_id } = body
    if (!refresh_token || !client_id) {
        await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing refresh_token or client_id' })
        return
    }

    const tokens = await mcpOAuthTokenService.refreshAccessToken({
        refreshToken: refresh_token,
        clientId: client_id,
    })

    await reply.status(200).send(tokens)
}

const tokenRequestSchema = z.object({
    grant_type: z.string(),
    code: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    code_verifier: z.string().optional(),
    redirect_uri: z.string().optional(),
    refresh_token: z.string().optional(),
    resource: z.string().optional(),
})

const TokenRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: tokenRequestSchema,
    },
}

type TokenRequestBody = z.infer<typeof tokenRequestSchema>
