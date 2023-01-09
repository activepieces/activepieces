import { apId, AppSecret, AppSecretId, Cursor, ProjectId, SeekPage, UpsertAppSecretRequest } from "shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppSecretEntity } from "./app-secret-entity";

const appSecretRepo = databaseConnection.getRepository(AppSecretEntity);

export const appSecretService = {
    async upsert(request: UpsertAppSecretRequest): Promise<AppSecret> {
        await appSecretRepo.upsert({ ...request, id: apId() }, ["name", "projectId"]);
        return appSecretRepo.findOneByOrFail({
            name: request.name,
            projectId: request.projectId
        })
    },
    async getOne(id: AppSecretId): Promise<AppSecret | null> {
        return appSecretRepo.findOneBy({
            id: id
        })
    },
    async delete(id: AppSecretId): Promise<void> {
        await appSecretRepo.delete({ id: id });
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppSecret>> {
       const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
       const paginator = buildPaginator({
        entity: AppSecretEntity,
        paginationKeys: ["created"],
        query: {
            limit,
            order: "ASC",
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
        },
    });
        const queryBuilder = appSecretRepo.createQueryBuilder("app_secret").where({ projectId });
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ projectId }));
        return paginationHelper.createPage<AppSecret>(data, cursor);
      }
};
