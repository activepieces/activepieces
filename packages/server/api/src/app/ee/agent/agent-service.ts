import { ActivepiecesError, ApId, apId, Cursor, ErrorCode, isNil, omit, Permission, PlatformId, ProjectId, sanitizeObjectForPostgresql, SeekPage, UserId } from '@activepieces/core-utils'
import { Agent, agentUtils, AgentVisibility, CreateAgentRequest, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets, In, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { AgentEntity, AgentWithRelations } from './agent-entity'
import { agentHelpers } from './agent-helpers'

const DEFAULT_PAGE_SIZE = 20
export const agentRepo = repoFactory(AgentEntity)

export const agentService = (log: FastifyBaseLogger) => ({
    async create({ projectId, ownerId, request }: CreateParams): Promise<Agent> {
        const visibility = request.visibility ?? AgentVisibility.PROJECT
        return agentRepo().save({
            id: apId(),
            projectId,
            ownerId,
            externalId: apId(),
            displayName: request.displayName,
            description: request.description ?? null,
            icon: request.icon,
            color: request.color,
            visibility,
            sharedWithUserIds: await resolveShare({ visibility, sharedWithUserIds: request.sharedWithUserIds, projectId, log }),
            draft: sanitizeObjectForPostgresql(request.draft),
            published: null,
        })
    },

    async list({ platformId, userId, projectId, cursor, limit }: ListParams): Promise<SeekPage<Agent>> {
        const readableProjectIds = await resolveReadableProjectIds({ platformId, userId, projectId, log })
        if (readableProjectIds.length === 0) {
            return paginationHelper.createPage([], null)
        }

        const { nextCursor, previousCursor } = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: AgentEntity,
            query: {
                limit: limit ?? DEFAULT_PAGE_SIZE,
                order: 'DESC',
                afterCursor: nextCursor,
                beforeCursor: previousCursor,
            },
        })

        const { data, cursor: newCursor } = await paginator.paginate(
            visibleAgents({ userId }).andWhere({ projectId: In(readableProjectIds) }),
        )
        return paginationHelper.createPage(data, newCursor)
    },

    async getOneOrThrow({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await visibleAgents({ userId }).andWhere({ id, projectId }).getOne()
        if (isNil(agent)) {
            throw agentNotFound(id)
        }
        return agent
    },

    async update({ id, projectId, userId, request }: UpdateParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        const visibility = request.visibility ?? agent.visibility
        const sharedWithUserIds = await resolveShare({
            visibility,
            sharedWithUserIds: request.sharedWithUserIds ?? agent.sharedWithUserIds,
            projectId,
            log,
        })
        const draft = isNil(request.draft) ? agent.draft : sanitizeObjectForPostgresql(request.draft)
        return agentRepo().save({ ...omit(agent, ['published']), ...request, draft, visibility, sharedWithUserIds })
    },

    async publish({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        if (!agentUtils.isPublishable(agent.draft)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'An agent needs instructions before it can be published' },
            })
        }
        const published = await agentRepo()
            .createQueryBuilder()
            .update()
            .set({ published: () => '"draft"' })
            .where('"id" = :id AND "projectId" = :projectId', { id, projectId })
            .andWhere('"draft" = CAST(:reviewedDraft AS jsonb)', { reviewedDraft: JSON.stringify(agent.draft) })
            .andWhere(visibleToUser({ userId, prefix: '' }))
            .returning('id')
            .execute()

        const publishedRows: unknown[] = published.raw ?? []
        if (publishedRows.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'The agent changed while it was being published, review it and publish again' },
            })
        }
        return this.getOneOrThrow({ id, projectId, userId })
    },

    async delete({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        await agentRepo().delete({ id, projectId })
        return agent
    },
})

function visibleAgents({ userId }: { userId: UserId }): SelectQueryBuilder<AgentWithRelations> {
    return agentRepo()
        .createQueryBuilder('agent')
        .where(visibleToUser({ userId, prefix: 'agent.' }))
}

function visibleToUser({ userId, prefix }: { userId: UserId, prefix: string }): Brackets {
    return new Brackets((qb) => {
        qb.where(`${prefix}"visibility" = :projectVisibility`, { projectVisibility: AgentVisibility.PROJECT })
            .orWhere(`${prefix}"ownerId" = :userId`, { userId })
            .orWhere(`:userId = ANY(${prefix}"sharedWithUserIds")`, { userId })
    })
}

async function resolveShare({ visibility, sharedWithUserIds, projectId, log }: ResolveShareParams): Promise<UserId[]> {
    if (visibility === AgentVisibility.PROJECT || isNil(sharedWithUserIds) || sharedWithUserIds.length === 0) {
        return []
    }
    const uniqueUserIds = [...new Set(sharedWithUserIds)]
    const members = await projectMemberService(log).listProjectMemberUserIds({ projectId })
    const strangers = uniqueUserIds.filter((userId) => !members.includes(userId))
    if (strangers.length > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'An agent can only be shared with people who are already in its project' },
        })
    }
    return uniqueUserIds
}

async function resolveReadableProjectIds({ platformId, userId, projectId, log }: ResolveProjectsParams): Promise<ProjectId[]> {
    const users = userService(log)
    const user = await users.getOneOrFail({ id: userId })
    const isPrivileged = users.isUserPrivileged(user)
    const projects = await agentHelpers.getUserProjects({ platformId, userId, log })
    const permittedProjectIds = isPrivileged
        ? []
        : await projectMemberService(log).listProjectIdsWithPermission({ userId, platformId, permission: Permission.READ_AGENT })

    return projects
        .filter((project) => isPrivileged || project.ownerId === userId || permittedProjectIds.includes(project.id))
        .map((project) => project.id)
        .filter((id) => isNil(projectId) || id === projectId)
}

function agentNotFound(id: ApId): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { entityId: id, entityType: 'agent' },
    })
}

type CreateParams = {
    projectId: ProjectId
    ownerId: UserId
    request: CreateAgentRequest
}

type ListParams = {
    platformId: PlatformId
    userId: UserId
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
    projectId?: ProjectId
    log: FastifyBaseLogger
}

type ResolveShareParams = {
    visibility: AgentVisibility
    sharedWithUserIds?: UserId[]
    projectId: ProjectId
    log: FastifyBaseLogger
}
