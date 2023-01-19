import { databaseConnection } from "../database/database-connection";
import { ProjectEntity } from "./project-entity";
import { apId, Project, UserId } from "@activepieces/shared";

const projectRepo = databaseConnection.getRepository(ProjectEntity);

export const projectService = {
  async create(request: { ownerId: UserId; displayName: string }): Promise<Project> {
    return await projectRepo.save({ id: apId(), ...request });
  },

  async getAll(ownerId: UserId): Promise<Project[] | null> {
    return await projectRepo.find({
      where: {
        ownerId,
      },
    });
  },
};
