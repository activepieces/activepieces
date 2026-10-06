import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { ListAgentRunsRequest, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { securityHelper } from '../../helper/security-helper'
import { agentConversationService } from './agent-conversation-service'
import { agentService } from './agent-service'

export const agentRunHistoryController: FastifyPluginAsyncZod = async (app) => {

    app.get('/conversations/runs', ListAgentRunsRoute, async (request) => {
        const readerId = await securityHelper.getUserIdFromRequest(request)
        assertNotNullOrUndefined(readerId, 'userId')
        await agentService(request.log).getOneOrThrow({
            id: request.query.agentId,
            projectId: request.projectId,
            userId: readerId,
        })
        return agentConversationService(request.log).listAgentRuns({
            projectId: request.projectId,
            agentId: request.query.agentId,
            cursor: request.query.cursor,
            limit: request.query.limit ?? 20,
        })
    })

    app.get('/conversations/runs/:id', GetAgentRunRoute, async (request) => {
        const readerId = await securityHelper.getUserIdFromRequest(request)
        assertNotNullOrUndefined(readerId, 'userId')
        const run = await agentConversationService(request.log).getAgentRunOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })
        await agentService(request.log).getOneOrThrow({
            id: run.agentId,
            projectId: request.projectId,
            userId: readerId,
        })
        return run
    })
}

const AGENT_RUN_PRINCIPALS = [PrincipalType.USER] as const

const RUN_PARAMS = z.object({ id: z.string() })

const ListAgentRunsRoute = {
    config: {
        security: securityAccess.project(
            AGENT_RUN_PRINCIPALS,
            Permission.READ_AGENT,
            { type: ProjectResourceType.QUERY },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the unattended runs a flow step made with this agent',
        querystring: ListAgentRunsRequest,
    },
}

const GetAgentRunRoute = {
    config: {
        security: securityAccess.project(
            AGENT_RUN_PRINCIPALS,
            Permission.READ_AGENT,
            { type: ProjectResourceType.QUERY },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Read one unattended run a flow step made, without being able to continue it',
        params: RUN_PARAMS,
        querystring: z.object({ projectId: z.string() }),
    },
}
