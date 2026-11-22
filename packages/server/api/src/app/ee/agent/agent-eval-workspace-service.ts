import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { z } from 'zod'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { transaction } from '../../core/db/transaction'
import { projectRepo, projectService } from '../../project/project-service'
import { platformProjectService } from '../projects/platform-project-service'

export const agentEvalWorkspaceService = (log: FastifyBaseLogger) => ({
    async resolveBaseProject({ platformId, ownerId, baseProjectId }: ResolveBaseProjectParams): Promise<Project | null> {
        if (!isNil(baseProjectId)) {
            const project = await projectRepo().findOneBy({ id: baseProjectId, platformId })
            return isNil(project) || isEvalWorkspace(project) ? null : project
        }
        const projects = await projectService(log).getAllForUser({ platformId, userId: ownerId, isPrivileged: true })
        return projects.find((project) => !isEvalWorkspace(project)) ?? null
    },

    async create({ platformId, baseProjectId }: CreateWorkspaceParams): Promise<Project> {
        await sweepStaleWorkspaces({ platformId, log })
        const metadata = { [EVAL_WORKSPACE_METADATA_KEY]: true, baseProjectId }
        const project = await platformProjectService(log).create({
            platformId,
            displayName: `${EVAL_WORKSPACE_NAME_PREFIX}${apId().slice(0, 8)}`,
            metadata,
        })
        const { error } = await tryCatch(() => transaction(async (entityManager) => {
            const sharedConnectionIds = await shareConnections({ platformId, fromProjectId: baseProjectId, toProjectId: project.id, entityManager })
            await projectRepo(entityManager).update({ id: project.id, platformId }, { metadata: { ...metadata, [SHARED_CONNECTION_IDS_METADATA_KEY]: sharedConnectionIds } })
        }))
        if (!isNil(error)) {
            await platformProjectService(log).markForDeletion({ id: project.id, platformId })
            throw error
        }
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
        .getMany()
    const stale = candidates.filter(isEvalWorkspace)
    if (stale.length === 0) {
        return
    }
    log.info({ platform: { id: platformId }, count: stale.length }, 'Sweeping stale eval workspaces')
    await deleteWorkspaces({ platformId, projects: stale, log })
}

async function deleteWorkspaces({ platformId, projects, log }: DeleteWorkspacesParams): Promise<void> {
    await unshareConnections({
        platformId,
        projectIds: projects.map((project) => project.id),
        connectionIds: projects.flatMap(sharedConnectionIdsOf),
    })
    for (const project of projects) {
        await platformProjectService(log).markForDeletion({ id: project.id, platformId })
    }
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

async function unshareConnections({ platformId, projectIds, connectionIds }: UnshareConnectionsParams): Promise<void> {
    if (connectionIds.length === 0) {
        return
    }
    await appConnectionsRepo()
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
const SharedConnectionIds = z.array(z.string()).catch([])
const UpdatedRows = z.array(z.object({ id: z.string() }))

type ResolveBaseProjectParams = {
    platformId: string
    ownerId: string
    baseProjectId: string | undefined
}

type CreateWorkspaceParams = {
    platformId: string
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
}
