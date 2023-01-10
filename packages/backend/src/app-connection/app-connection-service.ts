import { apId, AppConnection, AppConnectionId, AppCredentialId, Cursor, SeekPage, UpsertConnectionRequest } from "shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppConnectionEntity } from "./app-connection-entity";

const appConnectionRepo = databaseConnection.getRepository(AppConnectionEntity);

export const appConnectionService = {
    async upsert(request: UpsertConnectionRequest): Promise<AppConnection> {
        await appConnectionRepo.upsert({ ...request, id: apId() }, ["name", "appCredentialId"]);
        return appConnectionRepo.findOneByOrFail({
            name: request.name,
            appCredentialId: request.appCredentialId
        })
    },
    async getOne(id: AppConnectionId): Promise<AppConnection | null> {
        return appConnectionRepo.findOneBy({
            id: id
        })
    },
    async delete(id: AppConnectionId): Promise<void> {
        await appConnectionRepo.delete({ id: id });
    },
    async list(credentialId: AppCredentialId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppConnection>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
        const paginator = buildPaginator({
            entity: AppConnectionEntity,
            paginationKeys: ["created"],
            query: {
                limit,
                order: "ASC",
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        const queryBuilder = appConnectionRepo.createQueryBuilder("app_connection").where({ appSeceretId: credentialId });
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ appSeceretId: credentialId }));
        return paginationHelper.createPage<AppConnection>(data, cursor);
    }
};
