import {
    ListOAuth2AppRequest,
    OAuthApp,
    UpsertOAuth2AppRequest,
} from '@activepieces/ee-shared'
import { OAuthAppEntity, OAuthAppWithSecret } from './oauth-app.entity'
import { databaseConnection } from '../../database/database-connection'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import {
    ActivepiecesError,
    ErrorCode,
    SeekPage,
    apId,
    deleteProps,
    isNil,
} from '@activepieces/shared'
import { decryptString, encryptString } from '../../helper/encryption'

const oauthRepo = databaseConnection.getRepository(OAuthAppEntity)

export const oauthAppService = {
    async upsert({
        platformId,
        request,
    }: {
        platformId: string
        request: UpsertOAuth2AppRequest
    }): Promise<OAuthApp> {
        await oauthRepo.upsert(
            {
                platformId,
                ...request,
                clientSecret: encryptString(request.clientSecret),
                id: apId(),
            },
            ['platformId', 'pieceName'],
        )
        const connection = await oauthRepo.findOneByOrFail({
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
        const oauthApp = await oauthRepo.findOneByOrFail({
            platformId,
            pieceName,
            clientId,
        })
        return {
            ...oauthApp,
            clientSecret: decryptString(oauthApp.clientSecret),
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
            oauthRepo.createQueryBuilder('oauth_app').where({ platformId }),
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
        const oauthApp = await oauthRepo.findOneBy({ platformId, id })
        if (isNil(oauthApp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `OAuth with id ${id} not found`,
                },
            })
        }
        await oauthRepo.delete({ platformId, id })
    },
}
