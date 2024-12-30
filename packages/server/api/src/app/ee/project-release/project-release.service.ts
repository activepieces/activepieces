import { ProjectOperationType, ProjectSyncError, ProjectSyncPlan, ProjectSyncPlanOperation } from '@activepieces/ee-shared'
import { memoryLock } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, apId, CreateProjectReleaseRequestBody, DiffReleaseRequest, ErrorCode, isNil, ListProjectReleasesRequest, ProjectId, ProjectRelease, ProjectReleaseType, ProjectState, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { gitRepoService } from './git-sync/git-sync.service'
import { ProjectReleaseEntity } from './project-release.entity'
import { projectDiffService, ProjectOperation } from './project-state/project-diff.service'
import { projectStateService } from './project-state/project-state.service'
const projectReleaseRepo = repoFactory(ProjectReleaseEntity)

export const projectReleaseService = {
    async create(projectId: ProjectId, ownerId: ApId, importedBy: ApId, params: CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectRelease> {
        const lockKey = `project-release:${projectId}`
        const lock = await memoryLock.acquire(lockKey)
        try {
            const diffs = await findDiffOperations(projectId, ownerId, params, log)
            await projectStateService(log).apply({
                projectId,
                operations: diffs,
                selectedFlowsIds: params.selectedFlowsIds,
                log,
            })
            const fileId = await projectStateService(log).save(projectId, params.name, log)
            const projectRelease: ProjectRelease = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                projectId,
                importedBy,
                fileId,
                name: params.name,
                description: params.description,
                type: params.type,
            }
            return await projectReleaseRepo().save(projectRelease)
        }
        finally {
            await lock.release()
        }
    },
    async releasePlan(projectId: ProjectId, userId: ApId, params: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectSyncPlan> {
        const diffs = await findDiffOperations(projectId, userId, params, log)
        return toResponse(diffs)
    },
    async list({ projectId, request }: ListParams): Promise<SeekPage<ProjectRelease>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: ProjectReleaseEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(projectReleaseRepo()
            .createQueryBuilder('project_release')
            .where({
                projectId,
            })
            .orderBy('created', 'DESC'))
        const enrichedData = await Promise.all(data.map(
            async (projectRelease) => this.enrich(projectRelease),
        ))
        return paginationHelper.createPage<ProjectRelease>(enrichedData, cursor)
    },
    async enrich(projectRelease: ProjectRelease): Promise<ProjectRelease> {
        return {
            ...projectRelease,
            importedByUser: isNil(projectRelease.importedBy) ? undefined : await userService.getMetaInfo({
                id: projectRelease.importedBy,
            }) ?? undefined,
        }
    },
    async getOneOrThrow(params: GetOneProjectReleaseParams): Promise<ProjectRelease> {
        const projectRelease = await projectReleaseRepo().findOneBy({
            id: params.id,
            projectId: params.projectId,
        })
        if (isNil(projectRelease)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                },
            })
        }
        return projectRelease
    },
}
async function findDiffOperations(projectId: ProjectId, ownerId: ApId, params: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectOperation[]> {
    const newState = await getStateFromCreateRequest(projectId, ownerId, params, log) as ProjectState
    const currentState = await projectStateService(log).getCurrentState(projectId, log) as ProjectState
    const diffs = projectDiffService.diff({
        newState,
        currentState,
    })

    return diffs
}

function toResponse(operations: ProjectOperation[], errors: ProjectSyncError[] = []): ProjectSyncPlan {
    const responsePlans: ProjectSyncPlanOperation[] = operations.map((operation) => {
        switch (operation.type) {
            case ProjectOperationType.DELETE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.flowState.id,
                        displayName: operation.flowState.version.displayName,
                    },
                }
            case ProjectOperationType.CREATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.flowState.id,
                        displayName: operation.flowState.version.displayName,
                    },
                }
            case ProjectOperationType.UPDATE_FLOW:
                return {
                    type: operation.type,
                    flow: {
                        id: operation.newFlowState.id,
                        displayName: operation.newFlowState.version.displayName,
                    },
                    targetFlow: {
                        id: operation.flowState.id,
                        displayName: operation.flowState.version.displayName,
                    },
                }
        }
    })
    return {
        errors,
        operations: responsePlans,
    }
}
async function getStateFromCreateRequest(projectId: string, ownerId: ApId, request: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectState> {
    switch (request.type) {
        case ProjectReleaseType.GIT: {
            const gitRepo = await gitRepoService(log).getOneByProjectOrThrow({ projectId })
            return gitRepoService(log).getState({ gitRepo, userId: ownerId, log })
        }
        case ProjectReleaseType.PROJECT: {
            return projectStateService(log).getCurrentState(request.targetProjectId, log)
        }
        case ProjectReleaseType.ROLLBACK: {
            const projectRelease = await projectReleaseService.getOneOrThrow({
                id: request.projectReleaseId,
                projectId,
            })
            return projectStateService(log).getStateFromRelease(projectId, projectRelease.fileId, log)
        }
    }
}

type ListParams = {
    projectId: ProjectId
    request: ListProjectReleasesRequest
}

type GetOneProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
}
