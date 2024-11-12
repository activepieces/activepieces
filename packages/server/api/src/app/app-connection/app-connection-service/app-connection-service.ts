import { exceptionHandler, logger, SharedSystemProp, system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEnvironment,
    apId,
    AppConnection,
    AppConnectionId,
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionValue,
    Cursor,
    EngineResponseStatus,
    ErrorCode,
    isNil,
    OAuth2GrantType,
    ProjectId,
    SeekPage,
    spreadIfDefined,
    UpdateConnectionValueRequestBody,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { engineRunner } from 'server-worker'
import { Equal, FindOperator, ILike, In } from 'typeorm'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { repoFactory } from '../../core/db/repo-factory'
import { encryptUtils } from '../../helper/encryption'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import {
    getPiecePackage,
    pieceMetadataService,
} from '../../pieces/piece-metadata-service'
import {
    AppConnectionEntity,
    AppConnectionSchema,
} from '../app-connection.entity'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'
import { APArrayContains } from '../../database/database-connection'

const repo = repoFactory(AppConnectionEntity)

export const appConnectionService = {
    async upsert(params: UpsertParams): Promise<AppConnection> {
        const { projectId, request, ownerId, platformId } = params

        const validatedConnectionValue = await validateConnectionValue({
            connection: request,
            projectId,
        })

        const encryptedConnectionValue = encryptUtils.encryptObject({
            ...validatedConnectionValue,
            ...request.value,
        })

        const existingConnection = await repo().findOneBy({
            externalId: request.externalId,
            projectIds: APArrayContains('projectIds', [projectId]),
        })

        const connection = {
            ...request,
            displayName: request.displayName ?? request.externalId,
            ...spreadIfDefined('ownerId', ownerId),
            status: AppConnectionStatus.ACTIVE,
            value: encryptedConnectionValue,
            id: existingConnection?.id ?? apId(),
            scope: AppConnectionScope.PROJECT,
            projectIds: [projectId],
            platformId,
        }

        await repo().upsert(connection, ['id'])

        const updatedConnection = await repo().findOneByOrFail({
            externalId: request.externalId,
            projectIds: APArrayContains('projectIds', [projectId]),
        })
        return decryptConnection(updatedConnection)
    },
    async update(params: UpdateParams): Promise<AppConnection> {
        const { projectId, id, request } = params
        await repo().update({
            id,
            projectIds: APArrayContains('projectIds', [projectId]),
        }, {
            displayName: request.displayName,
        })
        return this.getOneOrThrow({
            projectId,
            id,
        })
    },

    async getOne({
        projectId,
        externalId,
    }: GetOneByName): Promise<AppConnection | null> {
        const encryptedAppConnection = await repo().findOne({
            where: {
                projectIds: APArrayContains('projectIds', [projectId]),
                externalId,
            },
            relations: ['owner'],
        })

        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }

        const appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection)) {
            return oauth2Util.removeRefreshTokenAndClientSecret(appConnection)
        }

        const refreshedConnection = await lockAndRefreshConnection({ projectId, externalId })
        if (isNil(refreshedConnection)) {
            return null
        }
        return oauth2Util.removeRefreshTokenAndClientSecret(refreshedConnection)
    },

    async getOneOrThrow(params: GetOneParams): Promise<AppConnection> {
        const connectionById = await repo().findOneBy({
            id: params.id,
            projectIds: APArrayContains('projectIds', [params.projectId]),
        })
        if (isNil(connectionById)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'AppConnection',
                    entityId: params.id,
                },
            })
        }
        const connection = await this.getOne({
            projectId: params.projectId,
            externalId: connectionById.externalId,
        })
        return connection!
    },

    async delete(params: DeleteParams): Promise<void> {
        await repo().delete(params)
    },

    async list({
        projectId,
        pieceName,
        cursorRequest,
        displayName,
        status,
        limit,
    }: ListParams): Promise<SeekPage<AppConnection>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: AppConnectionEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const querySelector: Record<string, string | FindOperator<string>> = {
            projectIds: APArrayContains('projectIds', [projectId]),
        }
        if (!isNil(pieceName)) {
            querySelector.pieceName = Equal(pieceName)
        }
        if (!isNil(displayName)) {
            querySelector.displayName = ILike(`%${displayName}%`)
        }
        if (!isNil(status)) {
            querySelector.status = In(status)
        }
        const queryBuilder = repo()
            .createQueryBuilder('app_connection')
            .where(querySelector)
            .leftJoinAndMapOne(
                'app_connection.owner',
                'user',
                'user',
                'app_connection."ownerId" = "user"."id"',
            )
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const promises: Promise<AppConnection>[] = []

        data.forEach((encryptedConnection) => {
            const apConnection: AppConnection =
                decryptConnection(encryptedConnection)
            promises.push(
                new Promise((resolve) => {
                    return resolve(apConnection)
                }),
            )
        })

        const refreshConnections = await Promise.all(promises)

        return paginationHelper.createPage<AppConnection>(
            refreshConnections,
            cursor,
        )
    },
}

const validateConnectionValue = async (
    params: ValidateConnectionValueParams,
): Promise<AppConnectionValue> => {
    const { connection, projectId } = params

    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName: connection.pieceName,
                props: connection.value.props,
            })
            return oauth2Handler[connection.value.type].claim({
                projectId,
                pieceName: connection.pieceName,
                request: {
                    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
                    code: connection.value.code,
                    tokenUrl,
                    clientId: connection.value.client_id,
                    props: connection.value.props,
                    authorizationMethod: connection.value.authorization_method,
                    codeVerifier: connection.value.code_challenge,
                    redirectUrl: connection.value.redirect_url,
                },
            })
        }
        case AppConnectionType.CLOUD_OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName: connection.pieceName,
                props: connection.value.props,
            })
            return oauth2Handler[connection.value.type].claim({
                projectId,
                pieceName: connection.pieceName,
                request: {
                    tokenUrl,
                    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
                    code: connection.value.code,
                    props: connection.value.props,
                    clientId: connection.value.client_id,
                    authorizationMethod: connection.value.authorization_method,
                    codeVerifier: connection.value.code_challenge,
                },
            })
        }
        case AppConnectionType.OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName: connection.pieceName,
                props: connection.value.props,
            })
            const auth = await oauth2Handler[connection.value.type].claim({
                projectId,
                pieceName: connection.pieceName,
                request: {
                    tokenUrl,
                    code: connection.value.code,
                    clientId: connection.value.client_id,
                    props: connection.value.props,
                    grantType: connection.value.grant_type!,
                    redirectUrl: connection.value.redirect_url,
                    clientSecret: connection.value.client_secret,
                    authorizationMethod: connection.value.authorization_method,
                    codeVerifier: connection.value.code_challenge,
                },
            })
            await engineValidateAuth({
                pieceName: connection.pieceName,
                projectId,
                auth,
            })
            return auth
        }
        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.SECRET_TEXT:
            await engineValidateAuth({
                pieceName: connection.pieceName,
                projectId,
                auth: connection.value,
            })
    }

    return connection.value
}

function decryptConnection(
    encryptedConnection: AppConnectionSchema,
): AppConnection {
    const value = encryptUtils.decryptObject<AppConnectionValue>(encryptedConnection.value)
    const connection: AppConnection = {
        ...encryptedConnection,
        value,
    }
    return connection
}

const engineValidateAuth = async (
    params: EngineValidateAuthParams,
): Promise<void> => {
    const environment = system.getOrThrow(SharedSystemProp.ENVIRONMENT)
    if (environment === ApEnvironment.TESTING) {
        return
    }
    const { pieceName, auth, projectId } = params

    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pieceName,
        projectId,
        version: undefined,
    })

    const engineToken = await accessTokenManager.generateEngineToken({
        projectId,
    })
    const engineResponse = await engineRunner.executeValidateAuth(engineToken, {
        piece: await getPiecePackage(projectId, {
            pieceName,
            pieceVersion: pieceMetadata.version,
            pieceType: pieceMetadata.pieceType,
            packageType: pieceMetadata.packageType,
        }),
        auth,
        projectId,
    })

    if (engineResponse.status !== EngineResponseStatus.OK) {
        logger.error(
            engineResponse,
            '[AppConnectionService#engineValidateAuth] engineResponse',
        )
        throw new ActivepiecesError({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            params: {
                message: 'Failed to run engine validate auth',
                context: engineResponse,
            },
        })
    }

    const validateAuthResult = engineResponse.result

    if (!validateAuthResult.valid) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_APP_CONNECTION,
            params: {
                error: validateAuthResult.error,
            },
        })
    }
}

/**
 * We should make sure this is accessed only once, as a race condition could occur where the token needs to be
 * refreshed and it gets accessed at the same time, which could result in the wrong request saving incorrect data.
 */
async function lockAndRefreshConnection({
    projectId,
    externalId,
}: {
    projectId: ProjectId
    externalId: string
}) {
    const refreshLock = await distributedLock.acquireLock({
        key: `${projectId}_${externalId}`,
        timeout: 20000,
    })

    let appConnection: AppConnection | null = null

    try {
        const encryptedAppConnection = await repo().findOneBy({
            projectIds: APArrayContains('projectIds', [projectId]),
            externalId,
        })
        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }
        appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection)) {
            return appConnection
        }
        const refreshedAppConnection = await refresh(appConnection, projectId)

        await repo().update(refreshedAppConnection.id, {
            status: AppConnectionStatus.ACTIVE,
            value: encryptUtils.encryptObject(refreshedAppConnection.value),
        })
        return refreshedAppConnection
    }
    catch (e) {
        exceptionHandler.handle(e)
        if (!isNil(appConnection) && oauth2Util.isUserError(e)) {
            appConnection.status = AppConnectionStatus.ERROR
            await repo().update(appConnection.id, {
                status: appConnection.status,
                updated: dayjs().toISOString(),
            })
        }
    }
    finally {
        await refreshLock.release()
    }
    return appConnection
}

function needRefresh(connection: AppConnection): boolean {
    if (connection.status === AppConnectionStatus.ERROR) {
        return false
    }
    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2:
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.OAUTH2:
            return oauth2Util.isExpired(connection.value)
        default:
            return false
    }
}

async function refresh(connection: AppConnection, projectId: ProjectId): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId,
                connectionValue: connection.value,
            })
            break
        default:
            break
    }
    return connection
}

type UpsertParams = {
    projectId: ProjectId
    ownerId: string | null
    platformId: string
    request: UpsertAppConnectionRequestBody
}

type GetOneByName = {
    projectId: ProjectId
    externalId: string
}

type GetOneParams = {
    projectId: ProjectId
    id: string
}

type DeleteParams = {
    projectId: ProjectId
    id: AppConnectionId
}

type ListParams = {
    projectId: ProjectId
    pieceName: string | undefined
    cursorRequest: Cursor | null
    displayName: string | undefined
    status: AppConnectionStatus[] | undefined
    limit: number
}

type UpdateParams = {
    projectId: ProjectId
    id: AppConnectionId
    request: UpdateConnectionValueRequestBody
}

type EngineValidateAuthParams = {
    pieceName: string
    projectId: ProjectId
    auth: AppConnectionValue
}

type ValidateConnectionValueParams = {
    connection: UpsertAppConnectionRequestBody
    projectId: ProjectId
}
