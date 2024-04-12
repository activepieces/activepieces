import crypto from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { appCredentialService } from '../app-credentials/app-credentials.service'
import { ConnectionKeyEntity } from './connection-key.entity'
import {
    AppCredentialType,
    ConnectionKey,
    ConnectionKeyId,
    GetOrDeleteConnectionFromTokenRequest,
    UpsertApiKeyConnectionFromToken,
    UpsertConnectionFromToken,
    UpsertOAuth2ConnectionFromToken,
    UpsertSigningKeyConnection,
} from '@activepieces/ee-shared'
import { ActivepiecesError, apId, AppConnection,
    AppConnectionType,
    Cursor,
    ErrorCode,
    ProjectId,
    SeekPage,
} from '@activepieces/shared'

const connectionKeyRepo = databaseConnection.getRepository(ConnectionKeyEntity)

export const connectionKeyService = {
    async getConnection({
        projectId,
        token,
        appName,
    }: GetOrDeleteConnectionFromTokenRequest): Promise<AppConnection | null> {
        const connectionName = await getConnectioName({ projectId, token })
        // TODO this is hardcoded for now, just to make sure it's not changed on client side
        const finalAppName = appName.replace('@activepieces/piece-', '')
        if (connectionName == null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
                params: {
                    token,
                },
            })
        }
        return appConnectionService.getOne({
            projectId,
            name: `${finalAppName}_${connectionName}`,
        })
    },
    async createConnection(
        request: UpsertConnectionFromToken,
    ): Promise<AppConnection> {
        const appCredential = await appCredentialService.getOneOrThrow(
            request.appCredentialId,
        )
        const projectId = appCredential.projectId
        const connectionName = await getConnectioName({
            projectId,
            token: request.token,
        })
        if (connectionName == null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
                params: {
                    token: request.token,
                },
            })
        }
        // TODO this is hardcoded for now, just to make sure it's not changed on client side
        const finalAppName = `@activepieces/piece-${appCredential.appName}`
        switch (appCredential.settings.type) {
            case AppCredentialType.API_KEY: {
                const apiRequest = request as UpsertApiKeyConnectionFromToken
                return appConnectionService.upsert({
                    projectId,
                    request: {
                        projectId,
                        name: `${appCredential.appName}_${connectionName}`,
                        pieceName: finalAppName,
                        type: AppConnectionType.SECRET_TEXT,
                        value: {
                            type: AppConnectionType.SECRET_TEXT,
                            secret_text: apiRequest.apiKey,
                        },
                    },
                })
            }
            case AppCredentialType.OAUTH2: {
                const apiRequest = request as UpsertOAuth2ConnectionFromToken
                return appConnectionService.upsert({
                    projectId,
                    request: {
                        name: `${appCredential.appName}_${connectionName}`,
                        pieceName: finalAppName,
                        projectId,
                        type: AppConnectionType.OAUTH2,
                        value: {
                            type: AppConnectionType.OAUTH2,
                            redirect_url: apiRequest.redirectUrl,
                            code: apiRequest.code,
                            props: apiRequest.props,
                            scope: appCredential.settings.scope,
                            client_id: appCredential.settings.clientId,
                            client_secret: appCredential.settings.clientSecret!,
                        },
                    },
                })
            }
        }
    },
    async upsert({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: UpsertSigningKeyConnection
    }): Promise<ConnectionKey> {
        const key = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
        })
        const savedConnection: ConnectionKey = await connectionKeyRepo.save({
            id: apId(),
            projectId,
            settings: {
                type: request.settings.type,
                publicKey: key.publicKey,
            },
        })
        return {
            ...savedConnection,
            settings: {
                type: savedConnection.settings.type,
                publicKey: savedConnection.settings.publicKey,
                privateKey: key.privateKey,
            },
        }
    },
    async list(
        projectId: ProjectId,
        cursorRequest: Cursor | null,
        limit: number,
    ): Promise<SeekPage<ConnectionKey>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest ?? null)
        const paginator = buildPaginator({
            entity: ConnectionKeyEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = connectionKeyRepo
            .createQueryBuilder('connection_key')
            .where({ projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<ConnectionKey>(data, cursor)
    },
    async delete(id: ConnectionKeyId): Promise<void> {
        await connectionKeyRepo.delete({
            id,
        })
    },
}

async function getConnectioName(request: {
    projectId: string
    token: string
}): Promise<string | null> {
    const connectionKeys = await connectionKeyRepo.findBy({
        projectId: request.projectId,
    })
    let connectionName: string | null = null
    for (let i = 0; i < connectionKeys.length; ++i) {
        const currentKey = connectionKeys[i]
        const decodedTokenSub = decodeTokenOrNull(
            request.token,
            currentKey.settings.publicKey,
        )?.sub
        if (decodedTokenSub !== null && decodedTokenSub !== undefined) {
            connectionName = decodedTokenSub as string
            break
        }
    }
    return connectionName
}

function decodeTokenOrNull(token: string, publicKey: string) {
    try {
        return jsonwebtoken.verify(token, publicKey!)
    }
    catch (e) {
        return null
    }
}
