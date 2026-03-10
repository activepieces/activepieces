import { securityAccess } from '@activepieces/server-common'
import { isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { OAuthError, oauthService } from './oauth-service'

export const oauthController: FastifyPluginAsyncZod = async (app) => {

    app.get('/authorize', AuthorizeRequest, async (req, reply) => {
        const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method, resource } = req.query

        if (response_type !== 'code') {
            return reply.status(400).send({ error: 'unsupported_response_type', error_description: 'Only "code" is supported' })
        }
        if (isNil(code_challenge) || code_challenge_method !== 'S256') {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'PKCE with S256 is required' })
        }

        const client = await oauthService(req.log).getClient(client_id, null)
        if (isNil(client)) {
            return reply.status(400).send({ error: 'invalid_client', error_description: 'Client not found' })
        }
        if (!client.redirectUris.includes(redirect_uri)) {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid redirect_uri' })
        }

        const consentParams = new URLSearchParams({
            client_id,
            redirect_uri,
            scope: scope ?? '',
            state: state ?? '',
            code_challenge,
            code_challenge_method,
            client_name: client.clientName,
            ...(resource ? { resource } : {}),
        })

        const publicUrl = await domainHelper.getPublicUrl({ path: '' })
        const consentUrl = `${publicUrl}/oauth/consent?${consentParams.toString()}`
        return reply.redirect(consentUrl)
    })

    app.post('/authorize/decision', AuthorizeDecisionRequest, async (req, reply) => {
        const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, resource, approved } = req.body

        if (!approved) {
            const redirectUrl = new URL(redirect_uri)
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('error_description', 'User denied the request')
            if (state) {
                redirectUrl.searchParams.set('state', state)
            }
            return reply.status(200).send({ redirectUrl: redirectUrl.toString() })
        }

        const validScopes = oauthService(req.log).validateScopes(scope ? scope.split(' ') : [])

        const code = await oauthService(req.log).saveAuthorizationCode({
            clientId: client_id,
            userId: req.principal.id,
            platformId: req.principal.platform.id,
            scopes: validScopes,
            codeChallenge: code_challenge,
            codeChallengeMethod: code_challenge_method,
            redirectUri: redirect_uri,
            resource,
        })

        const redirectUrl = new URL(redirect_uri)
        redirectUrl.searchParams.set('code', code)
        if (state) {
            redirectUrl.searchParams.set('state', state)
        }
        return reply.status(200).send({ redirectUrl: redirectUrl.toString() })
    })

    app.post('/token', TokenRequest, async (req, reply) => {
        try {
            const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } = req.body

            if (grant_type === 'authorization_code') {
                if (isNil(code) || isNil(redirect_uri) || isNil(client_id) || isNil(code_verifier)) {
                    return await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing required parameters' })
                }
                const tokens = await oauthService(req.log).exchangeAuthorizationCode({
                    code,
                    clientId: client_id,
                    redirectUri: redirect_uri,
                    codeVerifier: code_verifier,
                })
                return await reply.status(200).send(tokens)
            }

            if (grant_type === 'refresh_token') {
                if (isNil(refresh_token) || isNil(client_id)) {
                    return await reply.status(400).send({ error: 'invalid_request', error_description: 'Missing required parameters' })
                }
                const tokens = await oauthService(req.log).refreshAccessToken({
                    refreshToken: refresh_token,
                    clientId: client_id,
                })
                return await reply.status(200).send(tokens)
            }

            return await reply.status(400).send({ error: 'unsupported_grant_type' })
        }
        catch (e) {
            if (e instanceof OAuthError) {
                return reply.status(400).send({ error: e.error, error_description: e.errorDescription })
            }
            throw e
        }
    })

    app.post('/register', RegisterRequest, async (req, reply) => {
        const { client_name, redirect_uris, grant_types, token_endpoint_auth_method } = req.body

        const platformId = req.body.platform_id
        if (isNil(platformId)) {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'platform_id is required' })
        }

        const result = await oauthService(req.log).registerClient({
            clientName: client_name,
            redirectUris: redirect_uris,
            grantTypes: grant_types,
            tokenEndpointAuthMethod: token_endpoint_auth_method,
            platformId,
        })
        return reply.status(201).send({
            client_id: result.clientId,
            client_secret: result.clientSecret,
            client_name: result.clientName,
            redirect_uris: result.redirectUris,
            grant_types: result.grantTypes,
            token_endpoint_auth_method: token_endpoint_auth_method ?? 'none',
        })
    })

    app.post('/revoke', RevokeRequest, async (req, reply) => {
        const { token } = req.body
        await oauthService(req.log).revokeToken({ token })
        return reply.status(200).send({})
    })
}

const AuthorizeRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            client_id: z.string(),
            redirect_uri: z.string(),
            response_type: z.string(),
            scope: z.string().optional(),
            state: z.string().optional(),
            code_challenge: z.string(),
            code_challenge_method: z.string(),
            resource: z.string().optional(),
        }),
    },
}

const AuthorizeDecisionRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: z.object({
            client_id: z.string(),
            redirect_uri: z.string(),
            scope: z.string().optional(),
            state: z.string().optional(),
            code_challenge: z.string(),
            code_challenge_method: z.string(),
            resource: z.string().optional(),
            approved: z.boolean(),
        }),
    },
}

const TokenRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({
            grant_type: z.string(),
            code: z.string().optional(),
            redirect_uri: z.string().optional(),
            client_id: z.string().optional(),
            code_verifier: z.string().optional(),
            refresh_token: z.string().optional(),
        }),
    },
}

const RegisterRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({
            client_name: z.string(),
            redirect_uris: z.array(z.string()),
            grant_types: z.array(z.string()).optional(),
            token_endpoint_auth_method: z.string().optional(),
            scope: z.string().optional(),
            platform_id: z.string().optional(),
        }),
    },
}

const RevokeRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({
            token: z.string(),
        }),
    },
}
