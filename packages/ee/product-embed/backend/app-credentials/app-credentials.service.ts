import { apId, Cursor, ProjectId, SeekPage } from "@activepieces/shared";
import { AppCredentialEntity } from "./app-credentials.entity";
import { buildPaginator } from "@backend/helper/pagination/build-paginator"
import { paginationHelper } from "@backend/helper/pagination/pagination-utils";
import { databaseConnection } from "@backend/database/database-connection";
import { AppCredential, AppCredentialId } from "../../shared/app-credentials/app-credentials";
import { UpsertAppCredentialRequest } from "../../shared/app-credentials/app-credentials-requests";


export const appCredentialRepo = databaseConnection.getRepository(AppCredentialEntity);

export const appCredentialService = {
    async list(projectId: ProjectId, appName: string | undefined, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppCredential>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest ?? null);
        const paginator = buildPaginator({
            entity: AppCredentialEntity,
            query: {
                limit,
                order: "ASC",
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        let queryBuilder = appCredentialRepo.createQueryBuilder("app_credential").where({ projectId: projectId });
        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName: appName });
        }
        const { data, cursor } = await paginator.paginate(queryBuilder);
        return paginationHelper.createPage<AppCredential>(data, cursor);
    },
    async getOneOrThrow(id: AppCredentialId): Promise<AppCredential> {
        return await appCredentialRepo.findOneByOrFail({id});
    },  
    async upsert({projectId, request}: {projectId: ProjectId, request: UpsertAppCredentialRequest}): Promise<AppCredential | null> {
        await appCredentialRepo.upsert({
            id: apId(),
            projectId: projectId,
            ...request
        }, ['projectId', 'appName'])
        return appCredentialRepo.findOneBy({ projectId: projectId, appName: request.appName });
    },
    async delete(id: AppCredentialId): Promise<void> {
        appCredentialRepo.delete({
            id: id
        });
    }
}

