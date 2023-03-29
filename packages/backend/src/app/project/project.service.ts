import { databaseConnection } from '../database/database-connection';
import { ProjectEntity } from './project.entity';
import { apId, Project, ProjectId, UserId } from '@activepieces/shared';

const projectRepo = databaseConnection.getRepository(ProjectEntity);

export const projectService = {
    async create(request: { ownerId: UserId; displayName: string }): Promise<Project> {
        return await projectRepo.save({ id: apId(), ...request });
    },
    async getOne(projectId: ProjectId): Promise<Project | null> {
        return await projectRepo.findOneBy({
            id: projectId,
        });
    },
    async getAll(ownerId: UserId): Promise<Project[] | null> {
        return await projectRepo.find({
            where: {
                ownerId,
            },
        });
    },
};
