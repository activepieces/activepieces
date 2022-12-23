import {databaseConnection} from "../database/database-connection";
import {ProjectEntity} from "./project-entity";
import {apId, Project} from "shared";
import {UserId} from "shared/dist/model/user";
import {ProjectId} from "shared/dist/model/project";

const projectRepo = databaseConnection.getRepository(ProjectEntity);

export const projectService = {
    async create(request: {ownerId: UserId, displayName: string}): Promise<Project> {
        return projectRepo.save({id: apId(), ...request});
    },

    async getAll(ownerId: UserId): Promise<Project[] | null> {
        return projectRepo.find({
            where: {
                ownerId: ownerId
            }
        })
    },

    async getOne(id: ProjectId): Promise<Project | null> {
        return projectRepo.findOneBy({
            id: Object(id)
        });
    }
};
