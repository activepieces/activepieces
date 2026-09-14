import { isNil, tryCatch } from '@activepieces/core-utils'
import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { mcpOAuthCodeService } from './mcp-oauth-code.service'

export const mcpOAuthApproveController: FastifyPluginAsyncZod = async (app) => {

    app.post('/v1/mcp-oauth/approve', ApproveRequest, async (req, reply) => {
        const { authRequestId, projectId } = req.body
        const userId = req.principal.id
        const platformId = req.principal.platform.id

        if (isNil(projectId)) {
            const user = await userService(req.log).getOneOrFail({ id: userId })
            if (user.platformRole !== PlatformRole.ADMIN) {
                return reply.status(403).send({ error: 'access_denied', error_description: 'Only platform administrators can authorize platform-wide MCP access' })
            }
        }
        else {
            const user = await userService(req.log).getOneOrFail({ id: userId })
            const accessibleProjects = await projectService(req.log).getAllForUser({
                platformId,
                userId,
                isPrivileged: userService(req.log).isUserPrivileged(user),
            })
            if (!accessibleProjects.some(p => p.id === projectId)) {
                return reply.status(403).send({ error: 'access_denied', error_description: 'You do not have access to this project' })
            }
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
    scopes: string[]
    resource: string | null
    type: 'mcp_auth_request'
}
