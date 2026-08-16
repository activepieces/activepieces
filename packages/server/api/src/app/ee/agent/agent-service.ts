import { ActivepiecesError, ApId, apId, Cursor, ErrorCode, isNil, Permission, PlatformId, ProjectId, SeekPage, spreadIfNotUndefined, UserId } from '@activepieces/core-utils'
import { Agent, AgentVisibility, CreateAgentRequest, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { AgentEntity } from './agent-entity'

export const agentRepo = repoFactory(AgentEntity)

export const agentService = (log: FastifyBaseLogger) => ({
    async create({ projectId, ownerId, request }: CreateParams): Promise<Agent> {
        const id = apId()
        await agentRepo().save({
            id,
            projectId,
            ownerId,
            externalId: id,
            displayName: request.displayName,
            description: request.description ?? null,
            icon: request.icon,
            color: request.color,
            visibility: request.visibility ?? AgentVisibility.PROJECT,
            sharedWithUserIds: request.sharedWithUserIds ?? [],
            draft: request.draft,
            published: null,
        })
        log.info({ agent: { id }, project: { id: projectId } }, 'Agent created')
        return this.getOneOrThrow({ id, projectId, userId: ownerId })
    },

    async list({ platformId, userId, isPrivileged, projectId, cursor, limit }: ListParams): Promise<SeekPage<Agent>> {
        const readableProjectIds = await resolveReadableProjectIds({ platformId, userId, isPrivileged, projectId, log })
        if (readableProjectIds.length === 0) {
            return paginationHelper.createPage([], null)
        }

        const paginator = buildPaginator({
            entity: AgentEntity,
            query: {
                limit: limit ?? 20,
                order: 'DESC',
                afterCursor: paginationHelper.decodeCursor(cursor ?? null).nextCursor,
                beforeCursor: paginationHelper.decodeCursor(cursor ?? null).previousCursor,
            },
        })

        const query = agentRepo()
            .createQueryBuilder('agent')
            .where({ projectId: In(readableProjectIds) })
        applyVisibilityFilter(query, userId)

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage(data, newCursor)
    },

    async getOneOrThrow({ id, projectId, userId }: GetParams): Promise<Agent> {
        const query = agentRepo()
            .createQueryBuilder('agent')
            .where({ id, projectId })
        applyVisibilityFilter(query, userId)

        const agent = await query.getOne()
        if (isNil(agent)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'agent' },
            })
        }
        return agent
    },

    async update({ id, projectId, userId, request }: UpdateParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        await agentRepo().save({
            ...agent,
            ...spreadIfNotUndefined('displayName', request.displayName),
            ...spreadIfNotUndefined('description', request.description),
            ...spreadIfNotUndefined('icon', request.icon),
            ...spreadIfNotUndefined('color', request.color),
            ...spreadIfNotUndefined('visibility', request.visibility),
            ...spreadIfNotUndefined('sharedWithUserIds', request.sharedWithUserIds),
            ...spreadIfNotUndefined('draft', request.draft),
        })
        log.info({ agent: { id }, project: { id: projectId } }, 'Agent updated')
        return this.getOneOrThrow({ id, projectId, userId })
    },

    async delete({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        const publishedFlowNames = await listPublishedFlowsUsingAgent({ projectId, externalId: agent.externalId })
        if (publishedFlowNames.length > 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Agent is used by published flows: ${publishedFlowNames.join(', ')}` },
            })
        }
        await agentRepo().delete({ id, projectId })
        log.info({ agent: { id }, project: { id: projectId } }, 'Agent deleted')
        return agent
    },
})

async function resolveReadableProjectIds({ platformId, userId, isPrivileged, projectId, log }: ResolveProjectsParams): Promise<ProjectId[]> {
    const projects = await projectService(log).getAllForUser({ platformId, userId, isPrivileged })
    const accessible = isPrivileged ? projects : await filterByAgentReadPermission({ projects, userId, platformId, log })
    const accessibleIds = accessible.map((project) => project.id)
    if (isNil(projectId)) {
        return accessibleIds
    }
    return accessibleIds.filter((id) => id === projectId)
}

async function filterByAgentReadPermission({ projects, userId, platformId, log }: FilterByPermissionParams): Promise<{ id: ProjectId, ownerId: UserId }[]> {
    const permittedProjectIds = await projectMemberService(log).listProjectIdsWithPermission({
        userId,
        platformId,
        permission: Permission.READ_AGENT,
    })
    return projects.filter((project) => project.ownerId === userId || permittedProjectIds.includes(project.id))
}

function applyVisibilityFilter(query: AgentQuery, userId: UserId): void {
    query.andWhere(new Brackets((qb) => {
        qb.where('agent.visibility = :projectVisibility', { projectVisibility: AgentVisibility.PROJECT })
            .orWhere('agent."ownerId" = :userId', { userId })
            .orWhere(':userId = ANY(agent."sharedWithUserIds")', { userId })
    }))
}

async function listPublishedFlowsUsingAgent({ projectId, externalId }: { projectId: ProjectId, externalId: string }): Promise<string[]> {
    const flowVersions = await flowVersionRepo()
        .createQueryBuilder('flow_version')
        .select('flow_version."displayName"', 'displayName')
        .innerJoin('flow', 'flow', 'flow.id = flow_version."flowId"')
        .where('flow."projectId" = :projectId', { projectId })
        .andWhere('flow_version.id = flow."publishedVersionId"')
        .andWhere('flow_version."agentIds" && :externalIds', { externalIds: [externalId] })
        .getRawMany<{ displayName: string }>()
    return flowVersions.map((flowVersion) => flowVersion.displayName)
}

type AgentQuery = ReturnType<ReturnType<typeof agentRepo>['createQueryBuilder']>

type CreateParams = {
    projectId: ProjectId
    ownerId: UserId
    request: CreateAgentRequest
}

type ListParams = {
    platformId: PlatformId
    userId: UserId
    isPrivileged: boolean
    projectId?: ProjectId
    cursor?: Cursor
    limit?: number
}

type GetParams = {
    id: ApId
    projectId: ProjectId
    userId: UserId
}

type UpdateParams = GetParams & {
    request: UpdateAgentRequest
}

type ResolveProjectsParams = {
    platformId: PlatformId
    userId: UserId
    isPrivileged: boolean
    projectId?: ProjectId
    log: FastifyBaseLogger
}

type FilterByPermissionParams = {
    projects: { id: ProjectId, ownerId: UserId }[]
    userId: UserId
    platformId: PlatformId
    log: FastifyBaseLogger
}
