import { Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { mcpOAuthCodeService } from './mcp-oauth-code.service'

export const mcpOAuthApproveController: FastifyPluginAsyncZod = async (app) => {

    app.post('/v1/mcp-oauth/approve', ApproveRequest, async (req, reply) => {
        const { authRequestId, projectId } = req.body
        const userId = req.principal.id
        const platformId = req.principal.platform.id

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
            projectId,
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
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_MCP,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: z.object({
            authRequestId: z.string(),
            projectId: z.string(),
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
    type: 'mcp_auth_request'
}
