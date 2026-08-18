import { ActivepiecesError, ApId, assertNotNullOrUndefined, ErrorCode, Permission, SeekPage, UserId } from '@activepieces/core-utils'
import { Agent, AgentSummary, AgentTemplate, ApplicationEventName, CreateAgentRequest, DraftAgentRequest, DraftAgentResponse, ListAgentsRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../helper/application-events'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { securityHelper } from '../../helper/security-helper'
import { assertCreditsAndAppSumoNotExceeded } from '../../platform/billing-provider'
import { agentDraftAi } from './agent-draft-ai'
import { AgentEntity } from './agent-entity'
import { agentHelpers } from './agent-helpers'
import { agentAudit, agentRedaction, agentService } from './agent-service'
import { AGENT_TEMPLATES } from './agent-templates'

export const DRAFTS_PER_MINUTE = 20

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
        return reply.status(StatusCodes.CREATED).send(agentRedaction.withoutToolSecrets(agent))
    })

    app.get('/', ListAgentsRoute, async (request): Promise<SeekPage<AgentSummary>> => {
        return agentService(request.log).list({
            platformId: request.principal.platform.id,
            userId: await resolveUserId(request),
            projectId: request.query.projectId,
            cursor: request.query.cursor,
            limit: request.query.limit,
        })
    })

    app.get('/templates', ListTemplatesRoute, async (): Promise<SeekPage<AgentTemplate>> => {
        return paginationHelper.createPage([...AGENT_TEMPLATES], null)
    })

    app.post('/draft', DraftAgentRoute, async (request): Promise<DraftAgentResponse> => {
        const platformId = request.principal.platform.id
        await assertCreditsAndAppSumoNotExceeded({ platformId, log: request.log })
        const { allowed, count } = await agentHelpers.incrementAndCheckLimit({
            key: `agent-draft:${platformId}:${request.principal.id}`,
            limit: DRAFTS_PER_MINUTE,
            ttlSeconds: 60,
        })
        if (!allowed) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `You drafted ${count} agents in the last minute, above the limit of ${DRAFTS_PER_MINUTE}` },
            })
        }
        return agentDraftAi(request.log).draft({ platformId, projectId: request.projectId, prompt: request.body.prompt })
    })

    app.get('/:id', GetAgentRoute, async (request): Promise<Agent> => {
        return agentRedaction.withoutToolSecrets(await agentService(request.log).getOneOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
        }))
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
        return agentRedaction.withoutToolSecrets(agent)
    })

    app.post('/:id/publish', PublishAgentRoute, async (request): Promise<Agent> => {
        const agent = await agentService(request.log).publish({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.AGENT_PUBLISHED,
            data: { agent: { id: agent.id, displayName: agent.displayName, ...agentAudit.describePublished({ published: agent.draft }) } },
        })
        return agentRedaction.withoutToolSecrets(agent)
    })

    app.post('/:id/unpublish', UnpublishAgentRoute, async (request): Promise<Agent> => {
        const agent = await agentService(request.log).unpublish({
            id: request.params.id,
            projectId: request.projectId,
            userId: await resolveUserId(request),
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.AGENT_UNPUBLISHED,
            data: { agent: { id: agent.id, displayName: agent.displayName } },
        })
        return agentRedaction.withoutToolSecrets(agent)
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List agents across every project the caller can read',
        querystring: ListAgentsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(AgentSummary),
        },
    },
}

const ListTemplatesRoute = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['agents'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the starter agents, none of which need a connection',
        response: {
            [StatusCodes.OK]: SeekPage(AgentTemplate),
        },
    },
}

const DraftAgentRoute = {
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
        description: 'Draft an agent from a sentence, for review before it is created',
        body: DraftAgentRequest,
        response: {
            [StatusCodes.OK]: DraftAgentResponse,
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
        description: 'Update an agent',
        params: z.object({ id: ApId }),
        body: UpdateAgentRequest,
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
}

const PublishAgentRoute = {
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
        description: 'Publish an agent, so flow steps run the current draft',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
}

const UnpublishAgentRoute = {
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
        description: 'Take an agent offline, so flow steps stop running it',
        params: z.object({ id: ApId }),
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
        description: 'Delete an agent',
        params: z.object({ id: ApId }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}
