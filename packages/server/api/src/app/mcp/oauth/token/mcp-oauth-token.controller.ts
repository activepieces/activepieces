import { isNil } from '@activepieces/core-utils'
import { McpOAuthClient } from '@activepieces/shared'
import { FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthClientAuth } from '../client/mcp-oauth-client-auth'
import { mcpOAuthCodeService } from '../code/mcp-oauth-code.service'
import { mcpOAuthValidation } from '../mcp-oauth-validation'
import { mcpOAuthTokenService, OAuthTokenError } from './mcp-oauth-token.service'

export const mcpOAuthTokenController: FastifyPluginAsyncZod = async (app) => {

    app.post('/token', TokenRequest, async (req, reply) => {
        const { grant_type, client_id } = req.body
        const authorizationHeader = req.headers.authorization
        void reply.header('Cache-Control', 'no-store').header('Pragma', 'no-cache')

        try {
            if (grant_type === 'authorization_code') {
                return await handleAuthorizationCode({ authorizationHeader, body: req.body, reply })
            }
            if (grant_type === 'refresh_token') {
                return await handleRefreshToken({ authorizationHeader, body: req.body, reply })
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
            req.log.error({ error: e, clientId: client_id }, 'OAuth token error')
            return reply.status(500).send({ error: 'server_error' })
        }
    })
}

async function authenticateClient({ authorizationHeader, body, reply }: HandlerParams): Promise<McpOAuthClient | null> {
    const result = await mcpOAuthClientAuth.authenticate({
        authorizationHeader,
        clientId: body.client_id,
        clientSecret: body.client_secret,
    })
    if (result.status === 'anonymous') {
        await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing client_id' })
        return null
    }
    if (result.status === 'error') {
        await reply.status(400).send(result.payload)
        return null
    }
    return result.client
}

async function handleAuthorizationCode({ authorizationHeader, body, reply }: HandlerParams): Promise<void> {
    const { code, code_verifier, redirect_uri } = body
    if (!code || !code_verifier || !redirect_uri) {
        await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing code, code_verifier, or redirect_uri' })
        return
    }

    const client = await authenticateClient({ authorizationHeader, body, reply })
    if (isNil(client)) return

    const authCode = await mcpOAuthCodeService.consume({ code, clientId: client.clientId, redirectUri: redirect_uri })
    if (isNil(authCode)) {
        await reply.status(400).send({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' })
        return
    }

    const tokens = await mcpOAuthTokenService.exchangeCode({
        codeVerifier: code_verifier,
        codeChallenge: authCode.codeChallenge,
        codeChallengeMethod: authCode.codeChallengeMethod,
        clientId: client.clientId,
        userId: authCode.userId,
        projectId: authCode.projectId,
        platformId: authCode.platformId,
        scopes: authCode.scopes ?? ['mcp'],
    })

    await reply.status(200).send(tokens)
}

async function handleRefreshToken({ authorizationHeader, body, reply }: HandlerParams): Promise<void> {
    const { refresh_token } = body
    if (!refresh_token) {
        await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing refresh_token' })
        return
    }

    const client = await authenticateClient({ authorizationHeader, body, reply })
    if (isNil(client)) return

    const tokens = await mcpOAuthTokenService.refreshAccessToken({
        refreshToken: refresh_token,
        clientId: client.clientId,
    })

    await reply.status(200).send(tokens)
}

type HandlerParams = {
    authorizationHeader: string | undefined
    body: TokenRequestBody
    reply: FastifyReply
}

const tokenRequestSchema = z.object({
    grant_type: z.string().max(64),
    code: z.string().max(128).optional(),
    client_id: z.string().max(64).optional(),
    client_secret: z.string().max(512).optional(),
    code_verifier: z.string().max(256).optional(),
    redirect_uri: mcpOAuthValidation.storableText(2048).optional(),
    refresh_token: z.string().max(512).optional(),
    resource: z.string().max(2048).optional(),
})

const TokenRequest = {
    config: { security: securityAccess.public() },
    schema: {
        hide: true,
        body: tokenRequestSchema,
    },
}

type TokenRequestBody = z.infer<typeof tokenRequestSchema>
