import { IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { ProjectEntity } from './project-entity'
import { projectHooks } from './project-hooks'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId,
    ApId,
    ErrorCode,
    isNil,
    NotificationStatus,
    Project,
    ProjectId,
    spreadIfDefined,
    UserId,
} from '@activepieces/shared'

const repo = repoFactory(ProjectEntity)

export const projectService = {
    async create(params: CreateParams): Promise<Project> {
        const newProject: NewProject = {
            id: apId(),
            ...params,
            notifyStatus: NotificationStatus.ALWAYS,
        }
        const savedProject = await repo().save(newProject)
        rejectedPromiseHandler(projectHooks.getHooks().postCreate(savedProject))
        return savedProject
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

    async update(projectId: ProjectId, request: UpdateParams): Promise<Project> {
        await repo().update(
            {
                id: projectId,
                deleted: IsNull(),
            },
            {
                ...spreadIfDefined('displayName', request.displayName),
                ...spreadIfDefined('notifyStatus', request.notifyStatus),
            },
        )
        return this.getOneOrThrow(projectId)
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

type UpdateParams = {
    displayName?: string
    notifyStatus?: NotificationStatus
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
