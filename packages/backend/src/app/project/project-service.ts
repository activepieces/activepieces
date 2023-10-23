import { isNil, ProjectType } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ProjectEntity } from './project-entity'
import { ActivepiecesError, apId, ErrorCode, NotificationStatus, Project, ProjectId, UpdateProjectRequest, UserId } from '@activepieces/shared'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)

export const projectService = {
    async create(request: { ownerId: UserId, displayName: string }): Promise<Project> {
        return await projectRepo.save<Partial<Project>>({
            id: apId(),
            ...request,
            notifyStatus: NotificationStatus.ALWAYS,
            type: ProjectType.STANDALONE,
        })
    },
    async update(projectId: ProjectId, request: UpdateProjectRequest): Promise<Project | null> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.PROJECT_NOT_FOUND,
                params: {
                    id: projectId,
                },
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
    async getUserProject(ownerId: UserId): Promise<Project> {
        return await projectRepo.findOneByOrFail({
            ownerId,
        })
    },
}
