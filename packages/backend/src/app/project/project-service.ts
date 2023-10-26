import { isNil, ProjectType } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ProjectEntity } from './project-entity'
import { ActivepiecesError, apId, ErrorCode, NotificationStatus, Project, ProjectId, UserId } from '@activepieces/shared'
import { PlatformId, UpdateProjectRequest } from '@activepieces/ee-shared'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)

export const projectService = {
    async create(request: { ownerId: UserId, displayName: string, platformId: string | undefined, type: ProjectType }): Promise<Project> {
        return await projectRepo.save<Partial<Project>>({
            id: apId(),
            ...request,
            notifyStatus: NotificationStatus.ALWAYS,
            type: request.type,
        })
    },
    async update({ projectId, request, platformId }: { projectId: ProjectId, request: UpdateProjectRequest, platformId?: PlatformId }): Promise<Project | null> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })

        //TODO: Revisit on platform authentication 
        if (isNil(project) || project.id !== projectId && project.platformId !== platformId) {
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
