import { ApId, PlatformId, isNil } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
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
import { IsNull } from 'typeorm'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {
        const newProject: NewProject = {
            id: apId(),
            ...params,
            notifyStatus: NotificationStatus.ALWAYS,
        }

        return projectRepo.save(newProject)
    },

    async getOne(projectId: ProjectId | undefined): Promise<Project | null> {
        if (isNil(projectId)) {
            return null
        }

        return projectRepo.findOneBy({
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
        return projectRepo.findOneBy({
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

        await projectRepo.update(query, update)
    },

    async getByPlatformIdAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformIdAndExternalIdParams): Promise<Project | null> {
        return projectRepo.findOneBy({
            platformId,
            externalId,
            deleted: IsNull(),
        })
    },

    async delete({ id, platformId }: DeleteParams): Promise<void> {
        await softDeleteOrThrow({ id, platformId })
    },
}

const softDeleteOrThrow = async ({ id, platformId }: SoftDeleteOrThrowParams): Promise<void> => {
    const deleteResult = await projectRepo.softDelete({
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

type SoftDeleteOrThrowParams = DeleteParams

type NewProject = Omit<Project, 'created' | 'updated' | 'deleted'>
