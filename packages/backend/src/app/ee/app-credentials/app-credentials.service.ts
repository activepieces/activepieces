import { apId, Cursor, ProjectId, SeekPage } from '@activepieces/shared'
import { AppCredentialEntity } from './app-credentials.entity'
import { AppCredential, AppCredentialId, UpsertAppCredentialRequest } from '@activepieces/ee-shared'
import { databaseConnection } from '../../database/database-connection'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'


export const appCredentialRepo = databaseConnection.getRepository(AppCredentialEntity)

export const appCredentialService = {
    async list(projectId: ProjectId, appName: string | undefined, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppCredential>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest ?? null)
        const paginator = buildPaginator({
            entity: AppCredentialEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        let queryBuilder = appCredentialRepo.createQueryBuilder('app_credential').where({ projectId })
        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName })
        }
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<AppCredential>(data, cursor)
    },
    async getOneOrThrow(id: AppCredentialId): Promise<AppCredential> {
        return appCredentialRepo.findOneByOrFail({ id })
    },
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertAppCredentialRequest }): Promise<AppCredential | null> {
        await appCredentialRepo.upsert({
            id: apId(),
            projectId,
            ...request,
        }, ['projectId', 'appName'])
        return appCredentialRepo.findOneBy({ projectId, appName: request.appName })
    },
    async delete({ id, projectId }: DeleteParams): Promise<void> {
        await appCredentialRepo.delete({
            id,
            projectId,
        })
    },
}

type DeleteParams = {
    id: AppCredentialId
    projectId: ProjectId
}
