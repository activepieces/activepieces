import { ApId, isNil } from '@activepieces/shared'
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
        })
    },
    async getOneOrThrow(projectId: ProjectId): Promise<Project> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })

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
        })
    },
    async getUserProjectOrThrow(ownerId: UserId): Promise<Project> {
        return projectRepo.findOneByOrFail({
            ownerId,
        })
    },

    async addProjectToPlatform({
        projectId,
        platformId,
    }: AddProjectToPlatformParams): Promise<void> {
        await projectRepo.update(projectId, {
            platformId,
        })
    },

    async getByPlatformIdAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformIdAndExternalIdParams): Promise<Project | null> {
        return projectRepo.findOneBy({
            platformId,
            externalId,
        })
    },
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

type NewProject = Omit<Project, 'created' | 'updated'>
