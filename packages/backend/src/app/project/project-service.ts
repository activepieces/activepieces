import { ApId, isNil, ProjectType } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ProjectEntity } from './project-entity'
import { ActivepiecesError, apId, ErrorCode, NotificationStatus, Project, ProjectId, UserId } from '@activepieces/shared'
import { PlatformId, UpdateProjectRequest } from '@activepieces/ee-shared'
import { platformService } from '../ee/platform/platform.service'

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

    async update({ projectId, request, platformId, userId }: { userId: UserId, projectId: ProjectId, request: UpdateProjectRequest, platformId?: PlatformId }): Promise<Project | null> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })

        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }
        const projectOwner = await isProjectOwner({
            userId,
            platformId,
            project,
        })
        if (!projectOwner) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }

        await projectRepo.update(projectId, {
            ...project,
            ...request,
        })
        return projectRepo.findOneBy({
            id: projectId,
        })
    },
    async getOne(projectId: ProjectId): Promise<Project | null> {
        return await projectRepo.findOneBy({
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
    async getUserProject(ownerId: UserId): Promise<Project> {
        return await projectRepo.findOneByOrFail({
            ownerId,
        })
    },

    async addProjectToPlatform({ projectId, platformId }: AddProjectToPlatformParams): Promise<void> {
        await projectRepo.update(projectId, {
            type: ProjectType.PLATFORM_MANAGED,
            platformId,
        })
    },

    async getByPlatformIdAndExternalId({ platformId, externalId }: GetByPlatformIdAndExternalIdParams): Promise<Project | null> {
        return projectRepo.findOneBy({
            platformId,
            externalId,
        })
    },
}

async function isProjectOwner({ platformId, userId, project }: { userId: UserId, platformId: PlatformId | undefined, project: Project | null }): Promise<boolean> {
    const isProjectOwner = project?.ownerId === userId
    const isPlatformOwner = !isNil(platformId) && await platformService.checkUserIsOwner({ userId, platformId })
    return isProjectOwner || isPlatformOwner
}

type CreateParams = {
    ownerId: UserId
    displayName: string
    platformId: string | undefined
    type: ProjectType
    externalId?: string
}

type GetByPlatformIdAndExternalIdParams = {
    platformId: PlatformId
    externalId: string
}

type AddProjectToPlatformParams = {
    projectId: ProjectId
    platformId: ApId
}

type NewProject = Omit<Project, 'created' | 'updated'>
