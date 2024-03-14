import { ApId, FlowStatus, PlatformId, isNil } from '@activepieces/shared'
import { ProjectEntity } from './project-entity'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    NotificationStatus,
    Project,
    ProjectId,
    UserId,
} from '@activepieces/shared'
import { EntityManager, IsNull } from 'typeorm'
import { projectSideEffects } from './project-side-effects'
import { transaction } from '../core/db/transaction'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'

const repo = repoFactory(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {
        const newProject: NewProject = {
            id: apId(),
            ...params,
            notifyStatus: NotificationStatus.ALWAYS,
        }

        return repo().save(newProject)
    },

    async getOne(projectId: ProjectId | undefined): Promise<Project | null> {
        if (isNil(projectId)) {
            return null
        }

        return repo().findOneBy({
            id: projectId,
            deleted: IsNull(),
        })
    },

    async getOneOrThrow(projectId: ProjectId): Promise<Project> {
        const project = await this.getOne(projectId)

        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: projectId,
                    entityType: 'project',
                },
            })
        }

        return project
    },

    async getUserProject(ownerId: UserId): Promise<Project | null> {
        return repo().findOneBy({
            ownerId,
            deleted: IsNull(),
        })
    },

    async getUserProjectOrThrow(ownerId: UserId): Promise<Project> {
        const project = await this.getUserProject(ownerId)

        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    message: `userId=${ownerId}`,
                },
            })
        }

        return project
    },

    async addProjectToPlatform({ projectId, platformId }: AddProjectToPlatformParams): Promise<void> {
        const query = {
            id: projectId,
            deleted: IsNull(),
        }

        const update = {
            platformId,
        }

        await repo().update(query, update)
    },

    async getByPlatformIdAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformIdAndExternalIdParams): Promise<Project | null> {
        return repo().findOneBy({
            platformId,
            externalId,
            deleted: IsNull(),
        })
    },

    async softDelete({ id, platformId }: DeleteParams): Promise<void> {
        await transaction(async (entityManager) => {
            await assertAllProjectFlowsAreDisabled({
                projectId: id,
                entityManager,
            })

            await softDeleteOrThrow({
                id,
                platformId,
                entityManager,
            })

            await projectSideEffects.onSoftDelete({
                id,
                entityManager,
            })
        })
    },
}

const assertAllProjectFlowsAreDisabled = async (params: AssertAllProjectFlowsAreDisabledParams): Promise<void> => {
    const { projectId, entityManager } = params

    const projectHasEnabledFlows = await flowService.existsByProjectAndStatus({
        projectId,
        status: FlowStatus.ENABLED,
        entityManager,
    })

    if (projectHasEnabledFlows) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'project has enabled flows',
            },
        })
    }
}

const softDeleteOrThrow = async ({ id, platformId, entityManager }: SoftDeleteOrThrowParams): Promise<void> => {
    const deleteResult = await repo(entityManager).softDelete({
        id,
        platformId,
        deleted: IsNull(),
    })

    if (deleteResult.affected !== 1) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: id,
                entityType: 'project',
            },
        })
    }
}

type CreateParams = {
    ownerId: UserId
    displayName: string
    platformId: string
    externalId?: string
}

type GetByPlatformIdAndExternalIdParams = {
    platformId: string
    externalId: string
}

type AddProjectToPlatformParams = {
    projectId: ProjectId
    platformId: ApId
}

type DeleteParams = {
    id: ProjectId
    platformId: PlatformId
}

type SoftDeleteOrThrowParams = DeleteParams & {
    entityManager: EntityManager
}

type AssertAllProjectFlowsAreDisabledParams = {
    projectId: ProjectId
    entityManager: EntityManager
}

type NewProject = Omit<Project, 'created' | 'updated' | 'deleted'>
