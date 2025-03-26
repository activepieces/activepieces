import {
    ActivepiecesError,
    apId,
    deleteProps,
    ErrorCode,
    GlobalOAuthApp,
    GlobalOAuthAppWithSecret,
    isNil,
    ListOAuth2AppRequest,
    SeekPage,
    UpsertOAuth2AppRequest,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { GlobalOAuthAppEntity } from './global-oauth-app.entity'

const oauthRepo = repoFactory(GlobalOAuthAppEntity)

export const globalOAuthAppService = {
    async upsert({ request }: { request: UpsertOAuth2AppRequest }): Promise<GlobalOAuthApp> {
        await oauthRepo().upsert({ ...request, id: apId() }, ['pieceName'])
        const connection = await oauthRepo().findOneByOrFail({ pieceName: request.pieceName })
        return deleteProps(connection, ['clientSecret'])
    },
    async getWithSecret({ pieceName, clientId }: { pieceName: string, clientId?: string }): Promise<GlobalOAuthAppWithSecret> {
        const oauthApp = await oauthRepo().findOneByOrFail({ pieceName, clientId })
        return oauthApp
    },
    async list({ request }: { request: ListOAuth2AppRequest }): Promise<SeekPage<GlobalOAuthApp>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: GlobalOAuthAppEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(
            oauthRepo().createQueryBuilder('global_oauth_app'),
        )
        return paginationHelper.createPage<GlobalOAuthApp>(data, cursor)
    },
    async delete({ id }: { id: string }): Promise<void> {
        const oauthApp = await oauthRepo().findOneBy({ id })
        if (isNil(oauthApp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Global OAuth with id ${id} not found`,
                },
            })
        }
        await oauthRepo().delete({ id })
    },
}
