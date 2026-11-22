import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
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
        const project = await platformProjectService(log).create({
            platformId,
            displayName: `${EVAL_WORKSPACE_NAME_PREFIX}${apId().slice(0, 8)}`,
            metadata: { [EVAL_WORKSPACE_METADATA_KEY]: true, baseProjectId },
        })
        const { error } = await tryCatch(() => shareConnections({ platformId, fromProjectId: baseProjectId, toProjectId: project.id }))
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
        await unshareConnections({ platformId, projectId })
        await platformProjectService(log).markForDeletion({ id: projectId, platformId })
        return true
    },
})

function isEvalWorkspace(project: Pick<Project, 'displayName' | 'metadata'>): boolean {
    return project.displayName.startsWith(EVAL_WORKSPACE_NAME_PREFIX) && project.metadata?.[EVAL_WORKSPACE_METADATA_KEY] === true
}

async function shareConnections({ platformId, fromProjectId, toProjectId }: ShareConnectionsParams): Promise<void> {
    await appConnectionsRepo()
        .createQueryBuilder()
        .update()
        .set({ projectIds: () => 'array_append("projectIds", :toProjectId)' })
        .where('"platformId" = :platformId', { platformId })
        .andWhere('"projectIds" @> ARRAY[:fromProjectId]::varchar[]', { fromProjectId })
        .andWhere('NOT ("projectIds" @> ARRAY[:toProjectId]::varchar[])')
        .setParameter('toProjectId', toProjectId)
        .execute()
}

async function unshareConnections({ platformId, projectId }: { platformId: string, projectId: string }): Promise<void> {
    await appConnectionsRepo()
        .createQueryBuilder()
        .update()
        .set({ projectIds: () => 'array_remove("projectIds", :projectId)' })
        .where('"platformId" = :platformId', { platformId })
        .andWhere('"projectIds" @> ARRAY[:projectId]::varchar[]', { projectId })
        .execute()
}

const EVAL_WORKSPACE_NAME_PREFIX = 'eval-'
const EVAL_WORKSPACE_METADATA_KEY = 'evalWorkspace'

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

type ShareConnectionsParams = {
    platformId: string
    fromProjectId: string
    toProjectId: string
}
