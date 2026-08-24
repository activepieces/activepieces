import { createHash } from 'node:crypto'
import { AgentToolType, McpAuthType } from '@activepieces/core-piece-types'
import { ActivepiecesError, ApId, apId, Cursor, ErrorCode, isNil, omit, Permission, PlatformId, ProjectId, sanitizeObjectForPostgresql, SeekPage, unique, UserId } from '@activepieces/core-utils'
import { Agent, AgentConfig, AgentSummary, agentUtils, AgentVisibility, CreateAgentRequest, DefaultProjectRole, FlowVersion, Project, ProjectType, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets, In, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { AgentEntity, AgentWithRelations } from './agent-entity'
import { agentHelpers } from './agent-helpers'

const DEFAULT_PAGE_SIZE = 20
export const agentRepo = repoFactory(AgentEntity)

export const agentAudit = { describePublished }

export const agentRedaction = { withoutToolSecrets }

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
            sharedWithUserIds: await resolveShare({ visibility, requested: request.sharedWithUserIds, stored: [], projectId, log }),
            draft: sanitizeObjectForPostgresql(request.draft),
            published: null,
        })
    },

    async list({ platformId, userId, projectId, cursor, limit }: ListParams): Promise<SeekPage<AgentSummary>> {
        const readableProjects = await resolveReadableProjects({ platformId, userId, projectId, log })
        const readableProjectIds = readableProjects.map((project) => project.id)
        if (readableProjectIds.length === 0) {
            return paginationHelper.createPage([], null)
        }
        const projectById = new Map(readableProjects.map((project) => [project.id, project]))

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
            visibleAgents({ userId, isProjectAdmin: false }).andWhere({ projectId: In(readableProjectIds) }),
        )
        return paginationHelper.createPage(data.map((agent) => toSummary(agent, projectById.get(agent.projectId))), newCursor)
    },

    async getOneOrThrow({ id, projectId, userId }: GetParams): Promise<Agent> {
        const isProjectAdmin = await isProjectAdministrator({ projectId, userId, log })
        const agent = await visibleAgents({ userId, isProjectAdmin }).andWhere({ id, projectId }).getOne()
        if (isNil(agent)) {
            throw agentNotFound(id)
        }
        return agent
    },

    async getOneOrThrowByPlatform({ id, platformId, userId }: GetByPlatformParams): Promise<Agent> {
        const readableProjectIds = (await resolveReadableProjects({ platformId, userId, log })).map((project) => project.id)
        if (readableProjectIds.length === 0) {
            throw agentNotFound(id)
        }
        const agent = await visibleAgents({ userId, isProjectAdmin: false })
            .andWhere({ id, projectId: In(readableProjectIds) })
            .getOne()
        if (isNil(agent)) {
            throw agentNotFound(id)
        }
        return this.getOneOrThrow({ id, projectId: agent.projectId, userId })
    },

    async update({ id, projectId, userId, request }: UpdateParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        await assertMayChangeWhoCanSee({ agent, request, projectId, userId, log })
        const visibility = request.visibility ?? agent.visibility
        const sharedWithUserIds = await resolveShare({
            visibility,
            requested: request.sharedWithUserIds,
            stored: agent.sharedWithUserIds,
            projectId,
            log,
        })
        const draft = isNil(request.draft) ? agent.draft : sanitizeObjectForPostgresql(request.draft)
        await agentRepo().save({ ...omit(agent, ['published']), ...request, draft, visibility, sharedWithUserIds })
        return this.getOneOrThrow({ id, projectId, userId })
    },

    async publish({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        if (!agentUtils.isPublishable(agent.draft)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'An agent needs instructions before it can be published' },
            })
        }
        if (!isNil(agent.draft.providerConfigId) && isNil(agent.draft.provider)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'This agent pins an AI provider key without naming its provider, so a run would resolve a different one. Pick the provider that key belongs to.' },
            })
        }
        const published = await agentRepo()
            .createQueryBuilder()
            .update()
            .set({ published: () => '"draft"' })
            .where('"id" = :id AND "projectId" = :projectId', { id, projectId })
            .andWhere('"draft" = CAST(:reviewedDraft AS jsonb)', { reviewedDraft: JSON.stringify(agent.draft) })
            .andWhere(visibleToUser({ userId, prefix: '', isProjectAdmin: await isProjectAdministrator({ projectId, userId, log }) }))
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

    async unpublish({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        const blocking = flowsUsingAgent({ projectId, externalId: agent.externalId })
        const unpublished = await agentRepo()
            .createQueryBuilder()
            .update()
            .set({ published: null })
            .where('"id" = :id AND "projectId" = :projectId', { id, projectId })
            .andWhere(visibleToUser({ userId, prefix: '', isProjectAdmin: await isProjectAdministrator({ projectId, userId, log }) }))
            .andWhere(`NOT EXISTS (${blocking.getQuery()})`)
            .setParameters(blocking.getParameters())
            .returning('id')
            .execute()

        const unpublishedRows: unknown[] = unpublished.raw ?? []
        if (unpublishedRows.length === 0) {
            throw await stillUsedByFlows({ agent, blocking, verb: 'unpublishing it' })
        }
        return this.getOneOrThrow({ id, projectId, userId })
    },

    async getOneByExternalId({ projectId, externalId, visibility }: { projectId: ProjectId, externalId: string, visibility: AgentVisibility }): Promise<Agent | null> {
        return agentRepo().findOneBy({ projectId, externalId, visibility })
    },

    async delete({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        const blocking = flowsUsingAgent({ projectId, externalId: agent.externalId })
        const deleted = await agentRepo()
            .createQueryBuilder()
            .delete()
            .where('"id" = :id AND "projectId" = :projectId', { id, projectId })
            .andWhere(`NOT EXISTS (${blocking.getQuery()})`)
            .setParameters(blocking.getParameters())
            .returning('id')
            .execute()

        const deletedRows: unknown[] = deleted.raw ?? []
        if (deletedRows.length === 0) {
            throw await stillUsedByFlows({ agent, blocking, verb: 'deleting it' })
        }
        return agent
    },
})

async function stillUsedByFlows({ agent, blocking, verb }: {
    agent: Agent
    blocking: SelectQueryBuilder<FlowVersion>
    verb: string
}): Promise<ActivepiecesError> {
    const names = unique((await blocking.getRawMany<{ displayName: string }>()).map((row) => `"${row.displayName}"`))
    if (names.length === 0) {
        return agentNotFound(agent.id)
    }
    return new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `"${agent.displayName}" is still used by ${names.join(', ')}. The reference is live, so ${verb} would break their next run — remove the step or point it elsewhere first.` },
    })
}

function flowsUsingAgent({ projectId, externalId }: { projectId: ProjectId, externalId: string }): SelectQueryBuilder<FlowVersion> {
    const latestVersion = flowVersionRepo()
        .createQueryBuilder('latest')
        .select('latest.id')
        .where('latest."flowId" = blocking_flow.id')
        .orderBy('latest.created', 'DESC')
        .addOrderBy('latest.id', 'DESC')
        .limit(1)
    return flowVersionRepo()
        .createQueryBuilder('blocking_version')
        .select('blocking_version."displayName"', 'displayName')
        .innerJoin('flow', 'blocking_flow', 'blocking_flow.id = blocking_version."flowId"')
        .where('blocking_flow."projectId" = :projectId', { projectId })
        .andWhere(`(blocking_version.id = blocking_flow."publishedVersionId" OR blocking_version.id = (${latestVersion.getQuery()}))`)
        .andWhere('blocking_version."agentIds" && :externalIds', { externalIds: [externalId] })
}

function visibleAgents({ userId, isProjectAdmin }: { userId: UserId, isProjectAdmin: boolean }): SelectQueryBuilder<AgentWithRelations> {
    return agentRepo()
        .createQueryBuilder('agent')
        .where(visibleToUser({ userId, prefix: 'agent.', isProjectAdmin }))
}

function visibleToUser({ userId, prefix, isProjectAdmin }: VisibilityParams): Brackets {
    return new Brackets((qb) => {
        qb.where(`${prefix}"visibility" = :projectVisibility`, { projectVisibility: AgentVisibility.PROJECT })
            .orWhere(`${prefix}"ownerId" = :userId`, { userId })
            .orWhere(`:userId = ANY(${prefix}"sharedWithUserIds")`, { userId })
        if (isProjectAdmin) {
            qb.orWhere('1 = 1')
        }
    })
}

async function isProjectAdministrator({ projectId, userId, log }: { projectId: ProjectId, userId: UserId, log: FastifyBaseLogger }): Promise<boolean> {
    const role = await projectMemberService(log).getRole({ projectId, userId })
    return role?.name === DefaultProjectRole.ADMIN
}

async function resolveShare({ visibility, requested, stored, projectId, log }: ResolveShareParams): Promise<UserId[]> {
    if (visibility === AgentVisibility.PROJECT) {
        return []
    }
    const uniqueUserIds = [...new Set(requested ?? stored)]
    if (uniqueUserIds.length === 0) {
        return []
    }
    const withAccess = await listUsersWithProjectAccess({ projectId, log })
    if (isNil(requested)) {
        return uniqueUserIds.filter((userId) => withAccess.includes(userId))
    }
    const strangers = uniqueUserIds.filter((userId) => !withAccess.includes(userId))
    if (strangers.length > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'An agent can only be shared with people who already have access to its project' },
        })
    }
    return uniqueUserIds
}

async function assertMayChangeWhoCanSee({ agent, request, projectId, userId, log }: AssertShareParams): Promise<void> {
    const changesWhoCanSee = !isNil(request.visibility) || !isNil(request.sharedWithUserIds)
    if (!changesWhoCanSee || agent.ownerId === userId) {
        return
    }
    if (await isProjectAdministrator({ projectId, userId, log })) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: { message: 'Only the person who created an agent, or a project admin, can change who sees it' },
    })
}

async function listUsersWithProjectAccess({ projectId, log }: { projectId: ProjectId, log: FastifyBaseLogger }): Promise<UserId[]> {
    const [members, project] = await Promise.all([
        projectMemberService(log).listProjectMemberUserIds({ projectId }),
        projectService(log).getOneOrThrow(projectId),
    ])
    return [...new Set([...members, project.ownerId])]
}

async function resolveReadableProjects({ platformId, userId, projectId, log }: ResolveProjectsParams): Promise<Project[]> {
    const users = userService(log)
    const user = await users.getOneOrFail({ id: userId })
    const isPrivileged = users.isUserPrivileged(user)
    const projects = await agentHelpers.getUserProjects({ platformId, userId, log })
    const permittedProjectIds = isPrivileged
        ? []
        : await projectMemberService(log).listProjectIdsWithPermission({ userId, platformId, permission: Permission.READ_AGENT })

    return projects
        .filter((project) => isPrivileged || project.ownerId === userId || permittedProjectIds.includes(project.id))
        .filter((project) => isNil(projectId) || project.id === projectId)
}

function toSummary(agent: Agent, project?: Project): AgentSummary {
    return {
        ...omit(agent, ['draft', 'published']),
        projectDisplayName: project?.displayName ?? '',
        projectIsPrivate: project?.type === ProjectType.PERSONAL,
        toolCount: agent.draft.tools.length,
        toolPieceNames: agent.draft.tools.flatMap((tool) => tool.type === AgentToolType.PIECE ? [tool.pieceMetadata.pieceName] : []),
    }
}

function withoutToolSecrets(agent: Agent): Agent {
    return {
        ...agent,
        draft: redactConfig(agent.draft),
        published: isNil(agent.published) ? agent.published : redactConfig(agent.published),
    }
}

function redactConfig(config: AgentConfig): AgentConfig {
    return {
        ...config,
        tools: config.tools.map((tool) => tool.type !== AgentToolType.MCP || tool.auth.type === McpAuthType.NONE
            ? tool
            : { ...tool, auth: { type: tool.auth.type } as typeof tool.auth }),
    }
}

function describePublished({ published }: { published: AgentConfig }): { publishedDigest: string, publishedToolNames: string[] } {
    return {
        publishedDigest: createHash('sha256').update(JSON.stringify(published)).digest('hex').slice(0, 16),
        publishedToolNames: published.tools.map((tool) => tool.toolName),
    }
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

type GetByPlatformParams = {
    id: string
    platformId: PlatformId
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
    requested?: UserId[]
    stored: UserId[]
    projectId: ProjectId
    log: FastifyBaseLogger
}

type VisibilityParams = {
    userId: UserId
    prefix: 'agent.' | ''
    isProjectAdmin: boolean
}

type AssertShareParams = {
    agent: Agent
    request: UpdateAgentRequest
    projectId: ProjectId
    userId: UserId
    log: FastifyBaseLogger
}
