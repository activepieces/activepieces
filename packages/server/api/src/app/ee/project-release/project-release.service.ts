import { memoryLock } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, apId, CreateProjectReleaseRequestBody, DiffReleaseRequest, DiffState, ErrorCode, isNil, ListProjectReleasesRequest, PlatformId, ProjectId, ProjectOperationType, ProjectRelease, ProjectReleaseType, ProjectState, ProjectSyncError, ProjectSyncPlan, ProjectSyncPlanOperation, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { gitRepoService } from './git-sync/git-sync.service'
import { ProjectReleaseEntity } from './project-release.entity'
import { projectDiffService } from './project-state/project-diff.service'
import { projectStateService } from './project-state/project-state.service'
const projectReleaseRepo = repoFactory(ProjectReleaseEntity)

export const projectReleaseService = {
    async create(request: CreateProjectReleaseParams): Promise<ProjectRelease> {
        const { platformId, projectId, ownerId, params, log } = request
        const lockKey = `project-release:${params.projectId}`
        const lock = await memoryLock.acquire(lockKey)
        try {
            const diffs = await findDiffStates(projectId, ownerId, params, log)
            await projectStateService(log).apply({
                projectId,
                diffs,
                selectedFlowsIds: params.selectedFlowsIds ?? null,
                log,
                platformId,
            })
            const fileId = await projectStateService(log).save(projectId, params.name, log)
            const projectRelease: ProjectRelease = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                projectId,
                importedBy: ownerId,
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
        const diffs = await findDiffStates(projectId, userId, params, log)
        return toResponse({
            diffs,
            errors: [],
        })
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
            importedByUser: isNil(projectRelease.importedBy) ? undefined : await userService.getMetaInformation({
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
async function findDiffStates(projectId: ProjectId, ownerId: ApId, params: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<DiffState> {
    const newState = await getStateFromCreateRequest(projectId, ownerId, params, log) as ProjectState
    const currentState = await projectStateService(log).getCurrentState(projectId, log) as ProjectState
    const diffs = projectDiffService.diff({
        newState,
        currentState,
    })
    return diffs
}

async function toResponse(params: toResponseParams): Promise<ProjectSyncPlan> {
    const { diffs, errors } = params
    const { operations, connections, tables } = diffs
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
        connections,
        tables,
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

type CreateProjectReleaseParams = {
    platformId: PlatformId
    projectId: ProjectId
    ownerId: ApId
    params: CreateProjectReleaseRequestBody
    log: FastifyBaseLogger
}

type toResponseParams = {
    diffs: DiffState
    errors: ProjectSyncError[]
}

type ListParams = {
    projectId: ProjectId
    request: ListProjectReleasesRequest
}

type GetOneProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
}
