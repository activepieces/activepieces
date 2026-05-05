import { isNil, PlatformRole, PrincipalType } from '@activepieces/shared'
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

        const key = await jwtUtils.getJwtSecret()
        let authRequest: AuthRequestPayload
        try {
            authRequest = await jwtUtils.decodeAndVerify<AuthRequestPayload>({
                jwt: authRequestId,
                key,
                audience: JwtAudience.MCP_OAUTH_AUTH_REQUEST,
            })
        }
        catch {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid or expired authorization request' })
        }

        if (authRequest.type !== 'mcp_auth_request') {
            return reply.status(400).send({ error: 'invalid_request', error_description: 'Invalid authorization request type' })
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
