import {
    ListOAuth2AppRequest,
    OAuthApp,
    UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId,
    deleteProps,
    ErrorCode,
    isNil,
    SeekPage,
} from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { encryptUtils } from '../../helper/encryption'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { OAuthAppEntity, OAuthAppWithSecret } from './oauth-app.entity'

const oauthRepo = repoFactory(OAuthAppEntity)

export const oauthAppService = {
    async upsert({
        platformId,
        request,
    }: {
        platformId: string
        request: UpsertOAuth2AppRequest
    }): Promise<OAuthApp> {
        await oauthRepo().upsert(
            {
                platformId,
                ...request,
                clientSecret: await encryptUtils.encryptString(request.clientSecret),
                id: apId(),
            },
            ['platformId', 'pieceName'],
        )
        const connection = await oauthRepo().findOneByOrFail({
            platformId,
            pieceName: request.pieceName,
        })
        return deleteProps(connection, ['clientSecret'])
    },
    async getWithSecret({
        platformId,
        pieceName,
        clientId,
    }: {
        platformId: string
        pieceName: string
        clientId?: string
    }): Promise<OAuthAppWithSecret> {
        const oauthApp = await oauthRepo().findOneByOrFail({
            platformId,
            pieceName,
            clientId,
        })
        return {
            ...oauthApp,
            clientSecret: await encryptUtils.decryptString(oauthApp.clientSecret),
        }
    },
    async list({
        request,
        platformId,
    }: {
        platformId: string
        request: ListOAuth2AppRequest
    }): Promise<SeekPage<OAuthApp>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: OAuthAppEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(
            oauthRepo().createQueryBuilder('oauth_app').where({ platformId }),
        )
        return paginationHelper.createPage<OAuthApp>(data, cursor)
    },
    async delete({
        platformId,
        id,
    }: {
        platformId: string
        id: string
    }): Promise<void> {
        const oauthApp = await oauthRepo().findOneBy({ platformId, id })
        if (isNil(oauthApp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `OAuth with id ${id} not found`,
                },
            })
        }
        await oauthRepo().delete({ platformId, id })
    },
}
