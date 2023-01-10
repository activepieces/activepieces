import { apId, AppCredential, AppCredentialId, Cursor, ProjectId, SeekPage, UpsertAppCredentialsRequest } from "shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppCredentialEntity } from "./app-credential-entity";

const appCredentialRepo = databaseConnection.getRepository(AppCredentialEntity);

export const appCredentialService = {
    async upsert(request: UpsertAppCredentialsRequest): Promise<AppCredential> {
        await appCredentialRepo.upsert({ ...request, id: apId() }, ["name", "projectId"]);
        return appCredentialRepo.findOneByOrFail({
            name: request.name,
            projectId: request.projectId
        })
    },
    async getOne(id: AppCredentialId): Promise<AppCredential | null> {
        return appCredentialRepo.findOneBy({
            id: id
        })
    },
    async delete(id: AppCredentialId): Promise<void> {
        await appCredentialRepo.delete({ id: id });
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppCredential>> {
       const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
       const paginator = buildPaginator({
        entity: AppCredentialEntity,
        paginationKeys: ["created"],
        query: {
            limit,
            order: "ASC",
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
        },
    });
        const queryBuilder = appCredentialRepo.createQueryBuilder("app_credential").where({ projectId });
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ projectId }));
        return paginationHelper.createPage<AppCredential>(data, cursor);
      }
};
