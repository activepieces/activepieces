import { isNil, tryCatch } from '@activepieces/core-utils'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { userIdentityHelper } from '../../../helper/user-identity-helper'
import { mcpAccess } from '../../mcp-access'
import { mcpOAuthCodeService } from './mcp-oauth-code.service'

export const mcpOAuthApproveController: FastifyPluginAsyncZod = async (app) => {

    app.post('/v1/mcp-oauth/approve', ApproveRequest, async (req, reply) => {
        const { authRequestId, projectId } = req.body
        const userId = req.principal.id
        const platformId = req.principal.platform.id

        if (isNil(projectId)) {
            if (await userIdentityHelper(req.log).isUserEmbedded(userId)) {
                return reply.status(403).send({ error: 'access_denied', error_description: 'Embedded users must authorize MCP for a specific project' })
            }
            if (!await mcpAccess.hasMcpReach({ platformId, userId, log: req.log })) {
                return reply.status(403).send({ error: 'access_denied', error_description: 'You do not have MCP access in any project' })
            }
        }
        else if (!await mcpAccess.hasMcpAccessToProject({ platformId, userId, projectId, log: req.log })) {
            return reply.status(403).send({ error: 'access_denied', error_description: 'You do not have MCP access to this project' })
        }

        const { data: authRequest, error } = await tryCatch(() => verifyAuthRequest(authRequestId))
        if (error) {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid or expired authorization request' })
        }

        const code = await mcpOAuthCodeService.create({
            clientId: authRequest.clientId,
            userId,
            projectId: projectId ?? null,
            platformId,
            redirectUri: authRequest.redirectUri,
            codeChallenge: authRequest.codeChallenge,
            codeChallengeMethod: authRequest.codeChallengeMethod,
            scopes: authRequest.scopes,
            state: authRequest.state ?? undefined,
            nonce: authRequest.nonce,
        })

        const redirectUrl = new URL(authRequest.redirectUri)
        redirectUrl.searchParams.set('code', code)
        if (authRequest.state) {
            redirectUrl.searchParams.set('state', authRequest.state)
        }

        return reply.send({ redirectUrl: redirectUrl.toString() })
    })

    app.post('/v1/mcp-oauth/deny', DenyRequest, async (req, reply) => {
        const { data: authRequest, error } = await tryCatch(() => verifyAuthRequest(req.body.authRequestId))
        if (error) {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid or expired authorization request' })
        }

        const redirectUrl = new URL(authRequest.redirectUri)
        redirectUrl.searchParams.set('error', 'access_denied')
        if (authRequest.state) {
            redirectUrl.searchParams.set('state', authRequest.state)
        }

        return reply.send({ redirectUrl: redirectUrl.toString() })
    })
}

async function verifyAuthRequest(authRequestId: string): Promise<AuthRequestPayload> {
    const key = await jwtUtils.getJwtSecret()
    const authRequest = await jwtUtils.decodeAndVerify<AuthRequestPayload>({
        jwt: authRequestId,
        key,
        audience: JwtAudience.MCP_OAUTH_AUTH_REQUEST,
    })
    if (authRequest.type !== 'mcp_auth_request') {
        throw new Error('Invalid authorization request type')
    }
    return authRequest
}

const ApproveRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: z.object({
            authRequestId: z.string(),
            projectId: z.string().optional(),
        }),
    },
}

const DenyRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: z.object({
            authRequestId: z.string(),
        }),
    },
}

type AuthRequestPayload = {
    clientId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    state: string | null
    nonce: string | null
    scopes: string[]
    resource: string | null
    type: 'mcp_auth_request'
}
