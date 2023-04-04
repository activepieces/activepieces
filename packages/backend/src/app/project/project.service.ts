import { databaseConnection } from '../database/database-connection'
import { ProjectEntity } from './project.entity'
import { apId, NotificationStatus, Project, ProjectId, UpdateProjectRequest, UserId } from '@activepieces/shared'

const projectRepo = databaseConnection.getRepository(ProjectEntity)

export const projectService = {
    async create(request: { ownerId: UserId, displayName: string }): Promise<Project> {
        return await projectRepo.save({ id: apId(), ...request, notifications: NotificationStatus.ALWAYS })
    },
    async update(projectId: ProjectId, request: UpdateProjectRequest): Promise<Project> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })
        await projectRepo.update(projectId, {
            ...project,
            ...request,
        })
        return await projectRepo.findOneBy({
            id: projectId,
        })
    },
    async getOne(projectId: ProjectId): Promise<Project | null> {
        return await projectRepo.findOneBy({
            id: projectId,
        })
    },
    async getAll(ownerId: UserId): Promise<Project[] | null> {
        return await projectRepo.find({
            where: {
                ownerId,
            },
        })
    },
}
