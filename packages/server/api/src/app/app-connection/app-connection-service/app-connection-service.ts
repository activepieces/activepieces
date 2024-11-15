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
    AppConnectionWithoutSensitiveData,
    Cursor,
    EngineResponseStatus,
    ErrorCode,
    isNil,
    OAuth2GrantType,
    ProjectId,
    SeekPage,
    spreadIfDefined,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { engineRunner } from 'server-worker'
import { Equal, FindOperator, FindOptionsWhere, ILike, In } from 'typeorm'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { encryptUtils } from '../../helper/encryption'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import {
    getPiecePackage,
    pieceMetadataService,
} from '../../pieces/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import {
    AppConnectionEntity,
    AppConnectionSchema,
} from '../app-connection.entity'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

const repo = repoFactory(AppConnectionEntity)

export const appConnectionService = {
    async upsert(params: UpsertParams): Promise<AppConnectionWithoutSensitiveData> {
        const { projectIds, externalId, value, displayName, pieceName, ownerId, platformId, scope, type } = params

        await assertProjectIds(projectIds, platformId)
        const validatedConnectionValue = await validateConnectionValue({
            value,
            pieceName,
            projectId: projectIds?.[0],
            platformId,
        })

        const encryptedConnectionValue = encryptUtils.encryptObject({
            ...validatedConnectionValue,
            ...value,
        })

        const existingConnection = await repo().findOneBy({
            externalId,
            scope,
            platformId,
            ...(projectIds ? { projectIds: APArrayContains('projectIds', projectIds) } : {}),
        })

        const newId = existingConnection?.id ?? apId()
        const connection = {
            displayName,
            ...spreadIfDefined('ownerId', ownerId),
            status: AppConnectionStatus.ACTIVE,
            value: encryptedConnectionValue,
            externalId,
            pieceName,
            type,
            id: newId,
            scope,
            projectIds,
            platformId,
        }

        await repo().upsert(connection, ['id'])

        const updatedConnection = await repo().findOneByOrFail({
            id: newId,
            platformId,
            ...(projectIds ? { projectIds: APArrayContains('projectIds', projectIds) } : {}),
            scope,
        })
        return this.removeSensitiveData(updatedConnection)
    },
    async update(params: UpdateParams): Promise<AppConnectionWithoutSensitiveData> {
        const { projectIds, id, request, scope, platformId } = params

        if (!isNil(request.projectIds)) {
            await assertProjectIds(request.projectIds, platformId)
        }

        const filter: FindOptionsWhere<AppConnectionSchema> = {
            id,
            scope,
            platformId,
            ...(projectIds ? { projectIds: APArrayContains('projectIds', projectIds) } : {}),
        }

        await repo().update(filter, {
            displayName: request.displayName,
            ...spreadIfDefined('projectIds', request.projectIds),
        })

        const updatedConnection = await repo().findOneByOrFail(filter)
        return this.removeSensitiveData(updatedConnection)
    },

    async getOne({
        projectId,
        platformId,
        externalId,
    }: GetOneByName): Promise<AppConnection | null> {
        const encryptedAppConnection = await repo().findOne({
            where: {
                projectIds: APArrayContains('projectIds', [projectId]),
                externalId,
                platformId,
            },
            relations: ['owner'],
        })

        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }

        return this.decryptAndRefreshConnection(encryptedAppConnection, projectId)
    },

    async getOneOrThrowWithoutValue(params: GetOneParams): Promise<AppConnectionWithoutSensitiveData> {
        const connectionById = await repo().findOneBy({
            id: params.id,
            platformId: params.platformId,
            ...(params.projectId ? { projectIds: APArrayContains('projectIds', [params.projectId]) } : {}),
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
        return this.removeSensitiveData(connectionById)
    },

    async delete(params: DeleteParams): Promise<void> {
        await repo().delete({
            id: params.id,
            platformId: params.platformId,
            scope: params.scope,
            ...(params.projectId ? { projectIds: APArrayContains('projectIds', [params.projectId]) } : {}),
        })
    },

    async list({
        projectId,
        pieceName,
        cursorRequest,
        displayName,
        status,
        limit,
        scope,
        platformId,
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
            ...(projectId ? { projectIds: APArrayContains('projectIds', [projectId]) } : {}),
            ...spreadIfDefined('scope', scope),
            platformId,
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
    removeSensitiveData: (
        appConnection: AppConnection | AppConnectionSchema,
    ): AppConnectionWithoutSensitiveData => {
        const { value: _, ...appConnectionWithoutSensitiveData } = appConnection
        return appConnectionWithoutSensitiveData as AppConnectionWithoutSensitiveData
    },

    async decryptAndRefreshConnection(
        encryptedAppConnection: AppConnectionSchema,
        projectId: ProjectId,
    ): Promise<AppConnection | null> {
        const appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection)) {
            return oauth2Util.removeRefreshTokenAndClientSecret(appConnection)
        }

        const refreshedConnection = await lockAndRefreshConnection({ projectId, externalId: appConnection.externalId })
        if (isNil(refreshedConnection)) {
            return null
        }
        return oauth2Util.removeRefreshTokenAndClientSecret(refreshedConnection)
    },
    async deleteAllProjectConnections(projectId: string) {
        await repo().delete({
            scope: AppConnectionScope.PROJECT,
            projectIds: APArrayContains('projectIds', [projectId]),
        })
    },
}

async function assertProjectIds(projectIds: ProjectId[], platformId: string): Promise<void> {
    const filteredProjects = await projectRepo().countBy({
        id: In(projectIds),
        platformId,
    })
    if (filteredProjects !== projectIds.length) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'Project',
            },
        })
    }
}
const validateConnectionValue = async (
    params: ValidateConnectionValueParams,
): Promise<AppConnectionValue> => {
    const { value, pieceName, projectId, platformId } = params

    switch (value.type) {
        case AppConnectionType.PLATFORM_OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            return oauth2Handler[value.type].claim({
                projectId,
                platformId,
                pieceName,
                request: {
                    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
                    code: value.code,
                    tokenUrl,
                    clientId: value.client_id,
                    props: value.props,
                    authorizationMethod: value.authorization_method,
                    codeVerifier: value.code_challenge,
                    redirectUrl: value.redirect_url,
                },
            })
        }
        case AppConnectionType.CLOUD_OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            return oauth2Handler[value.type].claim({
                projectId,
                platformId,
                pieceName,
                request: {
                    tokenUrl,
                    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
                    code: value.code,
                    props: value.props,
                    clientId: value.client_id,
                    authorizationMethod: value.authorization_method,
                    codeVerifier: value.code_challenge,
                },
            })
        }
        case AppConnectionType.OAUTH2: {
            const tokenUrl = await oauth2Util.getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            const auth = await oauth2Handler[value.type].claim({
                projectId,
                platformId,
                pieceName,
                request: {
                    tokenUrl,
                    code: value.code,
                    clientId: value.client_id,
                    props: value.props,
                    grantType: value.grant_type!,
                    redirectUrl: value.redirect_url,
                    clientSecret: value.client_secret,
                    authorizationMethod: value.authorization_method,
                    codeVerifier: value.code_challenge,
                },
            })
            await engineValidateAuth({
                pieceName,
                projectId,
                platformId,
                auth,
            })
            return auth
        }
        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.SECRET_TEXT:
            await engineValidateAuth({
                platformId,
                pieceName,
                projectId,
                auth: value,
            })
    }

    return value
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
    const { pieceName, auth, projectId, platformId } = params

    const pieceMetadata = await pieceMetadataService.getOrThrow({
        name: pieceName,
        projectId,
        version: undefined,
        platformId,
    })

    const engineToken = await accessTokenManager.generateEngineToken({
        platformId,
        projectId,
    })

    const engineResponse = await engineRunner.executeValidateAuth(engineToken, {
        piece: await getPiecePackage(projectId, platformId, {
            pieceName,
            pieceVersion: pieceMetadata.version,
            pieceType: pieceMetadata.pieceType,
            packageType: pieceMetadata.packageType,
        }),
        platformId,
        auth,
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
                platformId: connection.platformId,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                platformId: connection.platformId,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.OAUTH2:
            connection.value = await oauth2Handler[connection.value.type].refresh({
                pieceName: connection.pieceName,
                platformId: connection.platformId,
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
    projectIds: ProjectId[]
    ownerId: string | null
    platformId: string
    scope: AppConnectionScope
    externalId: string
    value: UpsertAppConnectionRequestBody['value']
    displayName: string
    type: AppConnectionType
    pieceName: string
}

type GetOneByName = {
    projectId: ProjectId
    platformId: string
    externalId: string
}

type GetOneParams = {
    projectId: ProjectId | null
    platformId: string
    id: string
}

type DeleteParams = {
    projectId: ProjectId | null
    scope: AppConnectionScope
    id: AppConnectionId
    platformId: string
}

type ValidateConnectionValueParams = {
    value: UpsertAppConnectionRequestBody['value']
    pieceName: string
    projectId: ProjectId | undefined
    platformId: string
}

type ListParams = {
    projectId: ProjectId | null
    platformId: string
    pieceName: string | undefined
    cursorRequest: Cursor | null
    scope: AppConnectionScope | undefined
    displayName: string | undefined
    status: AppConnectionStatus[] | undefined
    limit: number
}

type UpdateParams = {
    projectIds: ProjectId[] | null
    platformId: string
    id: AppConnectionId
    scope: AppConnectionScope
    request: {
        displayName: string
        projectIds: ProjectId[] | null
    }
}

type EngineValidateAuthParams = {
    pieceName: string
    projectId: ProjectId | undefined
    platformId: string
    auth: AppConnectionValue
}
