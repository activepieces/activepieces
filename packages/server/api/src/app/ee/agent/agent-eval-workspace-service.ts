import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { PiecesFilterType, Project, ProjectPlan, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { z } from 'zod'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { projectRepo, projectService } from '../../project/project-service'
import { platformProjectJobs } from '../projects/platform-project-service'
import { ProjectPlanEntity } from '../projects/project-plan/project-plan.entity'

export const agentEvalWorkspaceService = (log: FastifyBaseLogger) => ({
    async resolveBaseProject({ platformId, ownerId, baseProjectId }: ResolveBaseProjectParams): Promise<Project | null> {
        if (!isNil(baseProjectId)) {
            const project = await projectRepo().findOneBy({ id: baseProjectId, platformId })
            return isNil(project) || isEvalWorkspace(project) ? null : project
        }
        const projects = await projectService(log).getAllForUser({ platformId, userId: ownerId, isPrivileged: true })
        return projects.find((project) => !isEvalWorkspace(project)) ?? null
    },

    async create({ platformId, ownerId, baseProjectId }: CreateWorkspaceParams): Promise<Project> {
        const { error: sweepError } = await tryCatch(() => sweepStaleWorkspaces({ platformId, log }))
        if (!isNil(sweepError)) {
            log.warn({ error: sweepError, platform: { id: platformId } }, 'Failed to sweep stale eval workspaces')
        }
        const project = await transaction(async (entityManager) => {
            const metadata = { [EVAL_WORKSPACE_METADATA_KEY]: true, baseProjectId }
            const savedProject = await projectService(log).create({
                ownerId,
                platformId,
                displayName: `${EVAL_WORKSPACE_NAME_PREFIX}${apId().slice(0, 8)}`,
                type: ProjectType.TEAM,
                metadata,
                callPostCreateHooks: false,
                entityManager,
            })
            await projectPlanRepo(entityManager).upsert({
                id: apId(),
                projectId: savedProject.id,
                pieces: [],
                piecesFilterType: PiecesFilterType.NONE,
                locked: false,
                name: 'platform',
            }, ['projectId'])
            const sharedConnectionIds = await shareConnections({ platformId, fromProjectId: baseProjectId, toProjectId: savedProject.id, entityManager })
            const finalMetadata = { ...metadata, [SHARED_CONNECTION_IDS_METADATA_KEY]: sharedConnectionIds }
            await projectRepo(entityManager).update({ id: savedProject.id, platformId }, { metadata: finalMetadata })
            return { ...savedProject, metadata: finalMetadata }
        })
        await projectService(log).callProjectPostCreateHooks(project)
        return project
    },

    async remove({ platformId, projectId }: RemoveWorkspaceParams): Promise<boolean> {
        const project = await projectRepo().findOneBy({ id: projectId, platformId })
        if (isNil(project) || !isEvalWorkspace(project)) {
            return false
        }
        await deleteWorkspaces({ platformId, projects: [project], log })
        return true
    },
})

async function sweepStaleWorkspaces({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
    const candidates = await projectRepo()
        .createQueryBuilder('project')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('project.deleted IS NULL')
        .andWhere('project.metadata ->> :markerKey = \'true\'', { markerKey: EVAL_WORKSPACE_METADATA_KEY })
        .andWhere('project.created < :cutoff', { cutoff: apDayjs().subtract(STALE_WORKSPACE_AGE_MINUTES, 'minute').toISOString() })
        .orderBy('project.created', 'ASC')
        .limit(STALE_SWEEP_BATCH_SIZE)
        .getMany()
    const stale = candidates.filter(isEvalWorkspace)
    if (stale.length === 0) {
        return
    }
    log.info({ platform: { id: platformId }, count: stale.length }, 'Sweeping stale eval workspaces')
    await deleteWorkspaces({ platformId, projects: stale, log })
}

async function deleteWorkspaces({ platformId, projects, log }: DeleteWorkspacesParams): Promise<void> {
    const projectIds = projects.map((project) => project.id)
    const deletedIds = await transaction(async (entityManager) => {
        await unshareConnections({ platformId, projectIds, connectionIds: projects.flatMap(sharedConnectionIdsOf), entityManager })
        const result = await projectRepo(entityManager)
            .createQueryBuilder()
            .softDelete()
            .where('"platformId" = :platformId', { platformId })
            .andWhere('id IN (:...projectIds)', { projectIds })
            .returning('id')
            .execute()
        return UpdatedRows.parse(result.raw ?? []).map((row) => row.id)
    })
    await Promise.all(deletedIds.map((id) => platformProjectJobs.scheduleHardDeleteProjectJob({ id, platformId, log })))
}

function isEvalWorkspace(project: Pick<Project, 'displayName' | 'metadata'>): boolean {
    return project.displayName.startsWith(EVAL_WORKSPACE_NAME_PREFIX) && project.metadata?.[EVAL_WORKSPACE_METADATA_KEY] === true
}

function sharedConnectionIdsOf(project: Pick<Project, 'metadata'>): string[] {
    return SharedConnectionIds.parse(project.metadata?.[SHARED_CONNECTION_IDS_METADATA_KEY])
}

async function shareConnections({ platformId, fromProjectId, toProjectId, entityManager }: ShareConnectionsParams): Promise<string[]> {
    const result = await appConnectionsRepo(entityManager)
        .createQueryBuilder()
        .update()
        .set({ projectIds: () => 'array_append("projectIds", :toProjectId)' })
        .where('"platformId" = :platformId', { platformId })
        .andWhere('"projectIds" @> ARRAY[:fromProjectId]::varchar[]', { fromProjectId })
        .andWhere('NOT ("projectIds" @> ARRAY[:toProjectId]::varchar[])')
        .setParameter('toProjectId', toProjectId)
        .returning('id')
        .execute()
    return UpdatedRows.parse(result.raw ?? []).map((row) => row.id)
}

async function unshareConnections({ platformId, projectIds, connectionIds, entityManager }: UnshareConnectionsParams): Promise<void> {
    if (connectionIds.length === 0) {
        return
    }
    await appConnectionsRepo(entityManager)
        .createQueryBuilder()
        .update()
        .set({ projectIds: () => 'ARRAY(SELECT kept.id FROM unnest("projectIds") WITH ORDINALITY AS kept(id, position) WHERE kept.id <> ALL(ARRAY[:...projectIds]::varchar[]) ORDER BY kept.position)' })
        .where('"platformId" = :platformId', { platformId })
        .andWhere('id IN (:...connectionIds)', { connectionIds })
        .setParameter('projectIds', projectIds)
        .execute()
}

const EVAL_WORKSPACE_NAME_PREFIX = 'eval-'
const EVAL_WORKSPACE_METADATA_KEY = 'evalWorkspace'
const SHARED_CONNECTION_IDS_METADATA_KEY = 'sharedConnectionIds'
const STALE_WORKSPACE_AGE_MINUTES = 60
const STALE_SWEEP_BATCH_SIZE = 20
const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)
const SharedConnectionIds = z.array(z.string()).catch([])
const UpdatedRows = z.array(z.object({ id: z.string() }))

type ResolveBaseProjectParams = {
    platformId: string
    ownerId: string
    baseProjectId: string | undefined
}

type CreateWorkspaceParams = {
    platformId: string
    ownerId: string
    baseProjectId: string
}

type RemoveWorkspaceParams = {
    platformId: string
    projectId: string
}

type DeleteWorkspacesParams = {
    platformId: string
    projects: Project[]
    log: FastifyBaseLogger
}

type ShareConnectionsParams = {
    platformId: string
    fromProjectId: string
    toProjectId: string
    entityManager: EntityManager
}

type UnshareConnectionsParams = {
    platformId: string
    projectIds: string[]
    connectionIds: string[]
    entityManager: EntityManager
}
