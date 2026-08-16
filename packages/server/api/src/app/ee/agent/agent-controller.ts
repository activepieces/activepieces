import { ApId, assertNotNullOrUndefined, Permission, SeekPage, UserId } from '@activepieces/core-utils'
import { Agent, ApplicationEventName, CreateAgentRequest, ListAgentsRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../helper/application-events'
import { securityHelper } from '../../helper/security-helper'
import { userService } from '../../user/user-service'
import { AgentEntity } from './agent-entity'
import { agentService } from './agent-service'

export const agentController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreateAgentRoute, async (request, reply) => {
        const ownerId = await resolveUserId(request)
        const agent = await agentService(request.log).create({
            projectId: request.projectId,
            ownerId,
            request: request.body,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.AGENT_CREATED,
            data: { agent: { id: agent.id, displayName: agent.displayName } },
        })
        return reply.status(StatusCodes.CREATED).send(agent)
    })

    app.get('/', ListAgentsRoute, async (request): Promise<SeekPage<Agent>> => {
        const userId = await resolveUserId(request)
        const user = await userService(request.log).getOneOrFail({ id: userId })
        return agentService(request.log).list({
            platformId: request.principal.platform.id,
            userId,
            isPrivileged: userService(request.log).isUserPrivileged(user),
            projectId: request.query.projectId,
            cursor: request.query.cursor,
            limit: request.query.limit,
        })
    })

    app.get('/:id', GetAgentRoute, async (request): Promise<Agent> => {
        return agentService(request.log).getOneOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
        })
    })

    app.post('/:id', UpdateAgentRoute, async (request): Promise<Agent> => {
        const agent = await agentService(request.log).update({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
            request: request.body,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.AGENT_UPDATED,
            data: { agent: { id: agent.id, displayName: agent.displayName } },
        })
        return agent
    })

    app.delete('/:id', DeleteAgentRoute, async (request, reply): Promise<void> => {
        const agent = await agentService(request.log).delete({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.AGENT_DELETED,
            data: { agent: { id: agent.id, displayName: agent.displayName } },
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function resolveUserId(request: FastifyRequest): Promise<UserId> {
    const userId = await securityHelper.getUserIdFromRequest(request)
    assertNotNullOrUndefined(userId, 'userId')
    return userId
}

const CreateAgentRoute = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_AGENT,
            { type: ProjectResourceType.BODY },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Create an agent in a project',
        body: CreateAgentRequest,
        response: {
            [StatusCodes.CREATED]: Agent,
        },
    },
}

const ListAgentsRoute = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List agents across every project the caller can read',
        querystring: ListAgentsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Agent),
        },
    },
}

const GetAgentRoute = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_AGENT,
            { type: ProjectResourceType.TABLE, tableName: AgentEntity },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get an agent',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
}

const UpdateAgentRoute = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_AGENT,
            { type: ProjectResourceType.TABLE, tableName: AgentEntity },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update an agent draft',
        params: z.object({ id: ApId }),
        body: UpdateAgentRequest,
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
}

const DeleteAgentRoute = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_AGENT,
            { type: ProjectResourceType.TABLE, tableName: AgentEntity },
        ),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete an agent, unless a published flow uses it',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}
