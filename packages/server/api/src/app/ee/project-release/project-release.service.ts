import { ProjectOperationType, ProjectSyncError, ProjectSyncPlan, ProjectSyncPlanOperation } from '@activepieces/ee-shared'
import { ActivepiecesError, apId, ApId, CreateProjectReleaseRequestBody, DiffReleaseRequest, ErrorCode, isNil, ListProjectReleasesRequest, ProjectId, ProjectRelease, ProjectReleaseType, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { gitSyncHelper } from './git-sync/git-sync-helper'
import { gitRepoService } from './git-sync/git-sync.service'
import { projectDiffService, ProjectOperation } from './project-diff/project-diff.service'
import { ProjectState } from './project-diff/project-mapping-state'
import { ProjectReleaseEntity } from './project-release.entity'
import { projectStateService } from './project-state/project-state.service'

const projectReleaseRepo = repoFactory(ProjectReleaseEntity)

export const projectReleaseService = {
    async create(projectId: ProjectId, importedBy: ApId, params: CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectRelease> {
   
        const diffs = await findDiffOperations(projectId, params, log)
        await projectStateService(log).apply({
            projectId,
            operations: diffs,
            mappingState: await projectStateService(log).getProjectMappingState(projectId),
            selectedFlowsIds: params.selectedFlowsIds,
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
        return projectReleaseRepo().save(projectRelease)
    },
    async releasePlan(projectId: ProjectId, params: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectSyncPlan> {
        const diffs = await findDiffOperations(projectId, params, log)
        return toResponse(diffs)
    },
    async list({ projectId, request }: ListParams): Promise<SeekPage<ProjectRelease>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: ProjectReleaseEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(projectReleaseRepo()
            .createQueryBuilder('project_release')
            .where({
                projectId,
            }))
        const enrichedData = await Promise.all(data.map(async (projectRelease) => ({
            ...projectRelease,
            importedByUser: isNil(projectRelease.importedBy) ? undefined : await userService.getMetaInfo({
                id: projectRelease.importedBy,
            }) ?? undefined,
        })))
        return paginationHelper.createPage<ProjectRelease>(enrichedData, cursor)
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
async function findDiffOperations(projectId: ProjectId, params: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectOperation[]> {
    const newState = await getStateFromCreateRequest(projectId, params, log)
    const oldState = await projectStateService(log).getCurrentState(projectId, log)

    return projectDiffService.diff({
        newState,
        oldState,
        mapping: await projectStateService(log).getProjectMappingState(projectId),
    })
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
async function getStateFromCreateRequest(projectId: string, request: DiffReleaseRequest | CreateProjectReleaseRequestBody, log: FastifyBaseLogger): Promise<ProjectState> {
    switch (request.type) {
        case ProjectReleaseType.GIT: {
            const gitRepo = await gitRepoService(log).getOneByProjectOrThrow({ projectId })
            return gitSyncHelper(log).getStateFromGit(gitRepo.id)
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
