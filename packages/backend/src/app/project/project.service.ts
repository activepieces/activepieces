import { databaseConnection } from '../database/database-connection'
import { ProjectEntity } from './project.entity'
import { apId, NotificationStatus, Project, ProjectId, UpdateProjectRequest, UserId } from '@activepieces/shared'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)

export const projectService = {
    async create(request: { ownerId: UserId, displayName: string }): Promise<Project> {
        return await projectRepo.save({ id: apId(), ...request, notifications: NotificationStatus.ALWAYS })
    },
    async update(projectId: ProjectId, request: UpdateProjectRequest): Promise<Project | null> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })
        // This shouldn't happen because we get the project from JWT token.
        if (!project) {
            throw new Error(`Project with id ${projectId} not found`)
        }
        await projectRepo.update(projectId, {
            ...project,
            ...request,
        });
        return projectRepo.findOneBy({
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
