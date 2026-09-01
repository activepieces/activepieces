import { createHash } from 'node:crypto'
import { AgentToolType, McpAuthType } from '@activepieces/core-piece-types'
import { ActivepiecesError, apId, ApId, connectionTemplate, Cursor, ErrorCode, isNil, omit, Permission, PlatformId, ProjectId, sanitizeObjectForPostgresql, SeekPage, unique, UserId } from '@activepieces/core-utils'
import { Agent, AgentConfig, AgentFlowTool, AgentKnowledgeBaseTool, AgentListSort, AgentMoveLoss, AgentMoveLossKind, AgentMovePreview, AgentRunSource, AgentSummary, agentUtils, AgentVisibility, CreateAgentRequest, DEFAULT_CHAT_TIER_ID, DefaultProjectRole, Project, ProjectType, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets, EntityManager, In, SelectQueryBuilder } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flowService } from '../../flows/flow/flow.service'
import { publishedFlowsUsingAgent, PublishedFlowsUsingAgent } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order, OrderByConfig } from '../../helper/pagination/paginator'
import { knowledgeBaseService } from '../../knowledge-base/knowledge-base.service'
import { resolvePermissionChecker } from '../../mcp/mcp-permissions'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { AgentConversationEntity } from './agent-conversation-entity'
import { AgentEntity, AgentWithRelations } from './agent-entity'
import { agentHelpers } from './agent-helpers'

const DEFAULT_PAGE_SIZE = 20
const MAX_NAMED_FLOWS_IN_USE = 3
export const agentRepo = repoFactory(AgentEntity)

export const agentAudit = { describePublished }

export const agentRedaction = { withoutToolSecrets }

const AGENT_MOVED_AWAY = 'That agent has just been moved somewhere else. Reload the page and try again.'

export const agentService = (log: FastifyBaseLogger) => ({
    async create({ platformId, projectId, ownerId, request }: CreateParams): Promise<Agent> {
        const visibility = request.visibility ?? AgentVisibility.PROJECT
        const draft = await withDefaultModel({ draft: request.draft, platformId, projectId, log })
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
            draft: sanitizeObjectForPostgresql(draft),
            published: null,
        })
    },

    async list({ platformId, userId, projectId, search, sort, cursor, limit }: ListParams): Promise<SeekPage<AgentSummary>> {
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
                orderBy: orderByForSort(sort),
                afterCursor: nextCursor,
                beforeCursor: previousCursor,
            },
        })

        const query = visibleAgents({ userId, isProjectAdmin: false }).andWhere({ projectId: In(readableProjectIds) })
        const needle = search?.trim().toLowerCase()
        if (!isNil(needle) && needle.length > 0) {
            query.andWhere(new Brackets((qb) => {
                qb.where('LOWER(agent."displayName") LIKE :needle', { needle: `%${needle}%` })
                    .orWhere('LOWER(COALESCE(agent."description", \'\')) LIKE :needle', { needle: `%${needle}%` })
            }))
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
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

    async update({ id, projectId, userId, request, goLive = false }: UpdateParams): Promise<Agent> {
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
        const published = goLive && agentUtils.isPublishable(draft) ? draft : agent.published
        // The write is conditioned on the project this request was authorised for. An edit that
        // overlaps a move would otherwise land by id alone, persisting changes into a project whose
        // permissions were never checked, and the lock serialises it against the move itself.
        await transaction(async (entityManager) => {
            await lockedAgentInProjectOrThrow({ entityManager, id, projectId })
            await entityManager.getRepository(AgentEntity).save(agentUpdatePayload({ id, request, draft, published, visibility, sharedWithUserIds }))
        })
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
        await this.getOneOrThrow({ id, projectId, userId })
        await agentRepo()
            .createQueryBuilder()
            .update()
            .set({ published: null })
            .where('"id" = :id AND "projectId" = :projectId', { id, projectId })
            .andWhere(visibleToUser({ userId, prefix: '', isProjectAdmin: await isProjectAdministrator({ projectId, userId, log }) }))
            .execute()
        return this.getOneOrThrow({ id, projectId, userId })
    },

    async editDraftTools({ id, projectId, userId, edit }: EditDraftToolsParams): Promise<Agent | null> {
        return transaction(async (entityManager) => {
            const repo = entityManager.getRepository(AgentEntity)
            const agent = await repo.createQueryBuilder('agent')
                .setLock('pessimistic_write')
                .where('agent.id = :id AND agent."projectId" = :projectId', { id, projectId })
                .getOne()
            if (isNil(agent)) {
                return null
            }
            const tools = edit(agent.draft.tools)
            if (isNil(tools)) {
                return null
            }
            await repo.save({ id, draft: sanitizeObjectForPostgresql({ ...agent.draft, tools }) })
            return this.getOneOrThrow({ id, projectId, userId })
        })
    },

    async publishedFlowsUsing({ agent, projectId, userId }: { agent: Agent, projectId: ProjectId, userId: UserId }): Promise<PublishedFlowsUsingAgent> {
        const checker = await resolvePermissionChecker({ userId, projectId, log })
        const mayReadFlows = isNil(checker.check(Permission.READ_FLOW, '__name_flows_using_agent'))
        const usage = await publishedFlowsUsingAgent({ projectId, agentExternalId: agent.externalId, nameLimit: mayReadFlows ? MAX_NAMED_FLOWS_IN_USE : 0 })
        return { total: usage.total, names: usage.names }
    },

    async movePreview({ id, projectId, userId, targetProjectId, platformId }: MoveParams & { id: string }): Promise<AgentMovePreview> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        await assertMayDestroy({ agent, projectId, userId, log })
        const target = await readableProjectOrThrow({ platformId, userId, targetProjectId, log })
        const [flowsInUse, mayCreateAgentsThere] = await Promise.all([
            this.publishedFlowsUsing({ agent, projectId, userId }),
            mayWriteAgentsIn({ projectId: target.id, userId, log }),
        ])
        // Nothing about the target is reported to someone who could not move the agent there, the
        // same way flow names stay behind READ_FLOW above.
        if (!mayCreateAgentsThere) {
            return { blockedByPublishedFlows: flowsInUse, mayCreateAgentsThere, toolsThatStopWorking: [], membersLosingAccess: 0 }
        }
        const [toolsThatStopWorking, sharedWithUserIds] = await Promise.all([
            toolsBrokenBy({ agent, targetProjectId: target.id, log }),
            resolveShare({ visibility: agent.visibility, requested: undefined, stored: agent.sharedWithUserIds, projectId: target.id, log }),
        ])
        return {
            blockedByPublishedFlows: flowsInUse,
            mayCreateAgentsThere,
            toolsThatStopWorking,
            membersLosingAccess: agent.sharedWithUserIds.length - sharedWithUserIds.length,
        }
    },

    async move({ id, projectId, userId, targetProjectId, platformId }: MoveParams & { id: string }): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        if (agent.projectId === targetProjectId) {
            return agent
        }
        await assertMayRemoveFromProject({ agent, projectId, userId, log })
        const target = await readableProjectOrThrow({ platformId, userId, targetProjectId, log })
        await assertMayWriteAgentsIn({ projectId: target.id, userId, log })
        const sharedWithUserIds = await resolveShare({ visibility: agent.visibility, requested: undefined, stored: agent.sharedWithUserIds, projectId: target.id, log })
        await transaction(async (entityManager) => {
            const repo = entityManager.getRepository(AgentEntity)
            await lockedAgentInProjectOrThrow({ entityManager, id, projectId })
            // Read inside the transaction: the unique index on (projectId, externalId) is the real
            // guard, and checking outside it turns a losing race into a 500 instead of this sentence.
            const clash = await repo.findOneBy({ projectId: target.id, externalId: agent.externalId })
            if (!isNil(clash)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: `"${target.displayName}" already holds an agent with the same external id, so this one cannot move there.` },
                })
            }
            await repo.update({ id, projectId }, { projectId: target.id, sharedWithUserIds })
            await entityManager.getRepository(AgentConversationEntity).update(
                { agentId: id, source: AgentRunSource.AGENT },
                { projectId: target.id },
            )
        })
        return this.getOneOrThrow({ id, projectId: target.id, userId })
    },

    async delete({ id, projectId, userId }: GetParams): Promise<Agent> {
        const agent = await this.getOneOrThrow({ id, projectId, userId })
        await assertMayRemoveFromProject({ agent, projectId, userId, log })
        await agentRepo().delete({ id, projectId })
        return agent
    },
})

function describeFlowsInUse({ total, names }: PublishedFlowsUsingAgent): string {
    const counted = total === 1 ? '1 published flow' : `${total} published flows`
    if (names.length === 0) {
        return `This agent is running in ${counted}. Remove it from them first.`
    }
    const listed = names.join(', ')
    const tail = total > names.length ? `, and ${total - names.length} more` : ''
    return `This agent is running in ${counted} (${listed}${tail}). Remove it from them first.`
}

function orderByForSort(sort?: AgentListSort): OrderByConfig[] {
    switch (sort) {
        case AgentListSort.NAME:
            return [{ field: 'displayName', order: Order.ASC }]
        case AgentListSort.CREATED:
            return [{ field: 'created', order: Order.DESC }]
        case AgentListSort.UPDATED:
        default:
            return [{ field: 'updated', order: Order.DESC }]
    }
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

async function withDefaultModel({ draft, platformId, projectId, log }: {
    draft: AgentConfig
    platformId: PlatformId
    projectId: ProjectId
    log: FastifyBaseLogger
}): Promise<AgentConfig> {
    if (!isNil(draft.modelName)) {
        return draft
    }
    const provider = await agentHelpers.resolveChatProviderName({ platformId, projectId, log })
    if (isNil(provider)) {
        return draft
    }
    return { ...draft, provider, modelName: agentHelpers.resolveModelIdForProvider({ provider, selectedModel: DEFAULT_CHAT_TIER_ID }) }
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

async function readableProjectOrThrow({ platformId, userId, targetProjectId, log }: { platformId: PlatformId, userId: UserId, targetProjectId: ProjectId, log: FastifyBaseLogger }): Promise<Project> {
    const [target] = await resolveReadableProjects({ platformId, userId, projectId: targetProjectId, log })
    if (isNil(target)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'That project is not one you can move an agent into' },
        })
    }
    return target
}

async function assertMayWriteAgentsIn({ projectId, userId, log }: { projectId: ProjectId, userId: UserId, log: FastifyBaseLogger }): Promise<void> {
    if (await mayWriteAgentsIn({ projectId, userId, log })) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: { message: 'Your role in that project cannot create or change agents there' },
    })
}

// Only the fields an update owns, keyed by id. Saving the whole row put a stale projectId back on
// the wire, so an update overlapping a move could drag the agent back to the project it had left
// while its conversations stayed in the new one. Nothing here may carry projectId, ownerId or
// externalId: those move or belong to creation, never to an edit.
export function agentUpdatePayload({ id, request, draft, published, visibility, sharedWithUserIds }: {
    id: string
    request: UpdateAgentRequest
    draft: Agent['draft']
    published: Agent['published']
    visibility: AgentVisibility
    sharedWithUserIds: UserId[]
}): Partial<Agent> & { id: string } {
    return { id, ...omit(request, ['goLive', 'draft', 'visibility', 'sharedWithUserIds']), draft, published, visibility, sharedWithUserIds }
}

// Taking an agent out of a project — deleting it or moving it elsewhere — is the same permission
// and the same refusal, so both paths ask here.
async function assertMayRemoveFromProject({ agent, projectId, userId, log }: AssertDestroyParams): Promise<void> {
    await assertMayDestroy({ agent, projectId, userId, log })
    const flowsInUse = await agentService(log).publishedFlowsUsing({ agent, projectId, userId })
    if (flowsInUse.total > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: describeFlowsInUse(flowsInUse) },
        })
    }
}

// One home for "this agent is still the one I was authorised for". Every write that must not land
// after a move takes it, so the wording and the lock mode cannot drift apart.
async function lockedAgentInProjectOrThrow({ entityManager, id, projectId }: { entityManager: EntityManager, id: string, projectId: ProjectId }): Promise<Agent> {
    const locked = await entityManager.getRepository(AgentEntity)
        .createQueryBuilder('agent')
        .setLock('pessimistic_write')
        .where('agent.id = :id', { id })
        .getOne()
    if (isNil(locked) || locked.projectId !== projectId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: AGENT_MOVED_AWAY },
        })
    }
    return locked
}

async function mayWriteAgentsIn({ projectId, userId, log }: { projectId: ProjectId, userId: UserId, log: FastifyBaseLogger }): Promise<boolean> {
    const checker = await resolvePermissionChecker({ userId, projectId, log })
    return isNil(checker.check(Permission.WRITE_AGENT, '__move_agent_into_project'))
}

// Everything a tool needs lives in one project, so a move can leave a tool with nothing to reach.
// The checks mirror what the run path resolves, so the warning and the failure agree.
async function toolsBrokenBy({ agent, targetProjectId, log }: { agent: Agent, targetProjectId: ProjectId, log: FastifyBaseLogger }): Promise<AgentMoveLoss[]> {
    const pinned = agent.draft.tools.flatMap((tool) => {
        if (tool.type !== AgentToolType.PIECE) {
            return []
        }
        const externalId = connectionTemplate.unwrapExternalId(tool.pieceMetadata.predefinedInput?.auth)
        return isNil(externalId) ? [] : [{ pieceName: tool.pieceMetadata.pieceName, externalId }]
    })
    const flowTools = agent.draft.tools.filter((tool): tool is AgentFlowTool => tool.type === AgentToolType.FLOW)
    const knowledgeTools = agent.draft.tools.filter((tool): tool is AgentKnowledgeBaseTool => tool.type === AgentToolType.KNOWLEDGE_BASE)

    const [connectionsThere, flowsThere, knowledgeThere] = await Promise.all([
        pinned.length === 0 ? Promise.resolve([]) : appConnectionService(log).getManyConnectionStates({ projectId: targetProjectId }),
        flowTools.length === 0 ? Promise.resolve({ data: [] }) : flowService(log).list({
            projectIds: [targetProjectId],
            externalIds: unique(flowTools.map((tool) => tool.externalFlowId)),
            cursorRequest: null,
            includeTriggerSource: false,
        }),
        knowledgeTools.length === 0 ? Promise.resolve([]) : knowledgeBaseService(log).getFilesByIds({
            projectId: targetProjectId,
            ids: unique(knowledgeTools.map((tool) => tool.sourceId)),
        }),
    ])

    const connectionIdsThere = new Set(connectionsThere.map((connection) => connection.externalId))
    const flowIdsThere = new Set(flowsThere.data.map((flow) => flow.externalId))
    const knowledgeIdsThere = new Set(knowledgeThere.map((file) => file.id))

    return [
        ...unique(pinned.filter((pin) => !connectionIdsThere.has(pin.externalId)).map((pin) => pin.pieceName))
            .map((label) => ({ kind: AgentMoveLossKind.CONNECTION, label })),
        ...unique(flowTools.filter((tool) => !flowIdsThere.has(tool.externalFlowId)).map((tool) => tool.flowDisplayName ?? tool.toolName))
            .map((label) => ({ kind: AgentMoveLossKind.FLOW, label })),
        ...unique(knowledgeTools.filter((tool) => !knowledgeIdsThere.has(tool.sourceId)).map((tool) => tool.sourceName))
            .map((label) => ({ kind: AgentMoveLossKind.KNOWLEDGE, label })),
    ]
}

async function assertMayDestroy({ agent, projectId, userId, log }: AssertDestroyParams): Promise<void> {
    if (agent.ownerId === userId || await isProjectAdministrator({ projectId, userId, log })) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: { message: 'Only the person who created an agent, or a project admin, can delete it and the conversations held with it' },
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
        isPublished: !isNil(agent.published),
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
    platformId: PlatformId
    projectId: ProjectId
    ownerId: UserId
    request: CreateAgentRequest
}

type ListParams = {
    platformId: PlatformId
    userId: UserId
    projectId?: ProjectId
    search?: string
    sort?: AgentListSort
    cursor?: Cursor
    limit?: number
}

type MoveParams = {
    projectId: ProjectId
    userId: UserId
    targetProjectId: ProjectId
    platformId: PlatformId
}

type EditDraftToolsParams = GetParams & {
    edit: (tools: AgentConfig['tools']) => AgentConfig['tools'] | null
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
    goLive?: boolean
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

type AssertDestroyParams = {
    agent: Agent
    projectId: ProjectId
    userId: UserId
    log: FastifyBaseLogger
}

type AssertShareParams = {
    agent: Agent
    request: UpdateAgentRequest
    projectId: ProjectId
    userId: UserId
    log: FastifyBaseLogger
}
