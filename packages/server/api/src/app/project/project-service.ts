import { ApId, isNil } from '@activepieces/shared'
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
import { repoFactory } from '../core/db/repo-factory'

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

type NewProject = Omit<Project, 'created' | 'updated' | 'deleted'>
