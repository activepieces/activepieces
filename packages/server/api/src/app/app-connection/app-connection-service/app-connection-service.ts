import dayjs from 'dayjs'
import { Equal, FindOperator, ILike } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { encryptUtils } from '../../helper/encryption'
import { engineHelper } from '../../helper/engine-helper'
import { acquireLock } from '../../helper/lock'
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
import { appConnectionsHooks } from './app-connection-hooks'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    AppConnection,
    AppConnectionId,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionValue,
    connectionNameRegex,
    Cursor,
    EngineResponseStatus,
    ErrorCode,
    isNil,
    OAuth2GrantType,
    ProjectId,
    SeekPage,
    UpsertAppConnectionRequestBody,
    ValidateConnectionNameRequestBody,
    ValidateConnectionNameResponse,
} from '@activepieces/shared'

const repo = databaseConnection.getRepository(AppConnectionEntity)

export const appConnectionService = {
    async validateConnectionName({ connectionName, projectId }: ValidateConnectionNameRequestBody & { projectId: ProjectId }): Promise<ValidateConnectionNameResponse> {
        //test regex on connection name
        const regex = new RegExp(`^${connectionNameRegex}$`)
        if (!regex.test(connectionName)) {
            return {
                isValid: false,
                error: 'Connection name is invalid',
            }
        }
        const connection = await repo.findOneBy({ name: connectionName, projectId })
        const isValid = isNil(connection)
        return {
            isValid,
            error: isValid ? undefined : 'Connection name already exists',
        }
    },
    async upsert(params: UpsertParams): Promise<AppConnection> {
        await appConnectionsHooks
            .getHooks()
            .preUpsert({ projectId: params.projectId })

        const { projectId, request } = params

        const validatedConnectionValue = await validateConnectionValue({
            connection: request,
            projectId,
        })

        const encryptedConnectionValue = encryptUtils.encryptObject({
            ...validatedConnectionValue,
            ...request.value,
        })

        const existingConnection = await repo.findOneBy({
            name: request.name,
            projectId,
        })

        const connection = {
            ...request,
            status: AppConnectionStatus.ACTIVE,
            value: encryptedConnectionValue,
            id: existingConnection?.id ?? apId(),
            projectId,
        }

        await repo.upsert(connection, ['name', 'projectId'])

        const updatedConnection = await repo.findOneByOrFail({
            name: request.name,
            projectId,
        })
        return decryptConnection(updatedConnection)
    },

    async getOne({
        projectId,
        name,
    }: GetOneByName): Promise<AppConnection | null> {
        const encryptedAppConnection = await repo.findOneBy({
            projectId,
            name,
        })

        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }

        const appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection)) {
            return oauth2Util.removeRefreshTokenAndClientSecret(appConnection)
        }

        const refreshedConnection = await lockAndRefreshConnection({ projectId, name })
        if (isNil(refreshedConnection)) {
            return null
        }
        return oauth2Util.removeRefreshTokenAndClientSecret(refreshedConnection)
    },

    async getOneOrThrow(params: GetOneParams): Promise<AppConnection> {
        const connectionById = await repo.findOneBy({
            id: params.id,
            projectId: params.projectId,
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
        return (await this.getOne({
            projectId: params.projectId,
            name: connectionById.name,
        }))!
    },

    async delete(params: DeleteParams): Promise<void> {
        await repo.delete(params)
    },

    async list({
        projectId,
        pieceName,
        cursorRequest,
        name,
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
            projectId,
        }
        if (!isNil(pieceName)) {
            querySelector.pieceName = Equal(pieceName)
        }
        if (!isNil(name)) {
            querySelector.name = ILike(`%${name}%`)
        }
        const queryBuilder = repo
            .createQueryBuilder('app_connection')
            .where(querySelector)
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

    async countByProject({ projectId }: CountByProjectParams): Promise<number> {
        return repo.countBy({ projectId })
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
            return oauth2Handler[connection.value.type].claim({
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
    const { pieceName, auth, projectId } = params

    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pieceName,
        projectId,
        version: undefined,
    })

    const engineResponse = await engineHelper.executeValidateAuth({
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
    name,
}: {
    projectId: ProjectId
    name: string
}) {
    const refreshLock = await acquireLock({
        key: `${projectId}_${name}`,
        timeout: 20000,
    })

    let appConnection: AppConnection | null = null

    try {
        const encryptedAppConnection = await repo.findOneBy({
            projectId,
            name,
        })
        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }
        appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection)) {
            return appConnection
        }
        const refreshedAppConnection = await refresh(appConnection)

        await repo.update(refreshedAppConnection.id, {
            status: AppConnectionStatus.ACTIVE,
            value: encryptUtils.encryptObject(refreshedAppConnection.value),
        })
        return refreshedAppConnection
    }
    catch (e) {
        exceptionHandler.handle(e)
        if (!isNil(appConnection) && oauth2Util.isUserError(e)) {
            appConnection.status = AppConnectionStatus.ERROR
            await repo.update(appConnection.id, {
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

async function refresh(connection: AppConnection): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId: connection.projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId: connection.projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                projectId: connection.projectId,
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
    request: UpsertAppConnectionRequestBody
}

type GetOneByName = {
    projectId: ProjectId
    name: string
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
    name: string | undefined
    limit: number
}

type CountByProjectParams = {
    projectId: ProjectId
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
