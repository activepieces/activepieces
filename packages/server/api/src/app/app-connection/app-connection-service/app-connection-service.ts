import { AppSystemProp, exceptionHandler, UserInteractionJobType } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEnvironment,
    apId,
    AppConnection,
    AppConnectionId,
    AppConnectionOwners,
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionValue,
    AppConnectionWithoutSensitiveData,
    ConnectionState,
    Cursor,
    EngineResponseStatus,
    ErrorCode,
    isNil,
    OAuth2GrantType,
    PlatformId,
    PlatformRole,
    ProjectId,
    SeekPage,
    spreadIfDefined,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperValidateAuthResult } from 'server-worker'
import { Equal, FindOperator, FindOptionsWhere, ILike, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import { encryptUtils } from '../../helper/encryption'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import {
    getPiecePackageWithoutArchive,
    pieceMetadataService,
} from '../../pieces/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import {
    AppConnectionEntity,
    AppConnectionSchema,
} from '../app-connection.entity'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

const repo = repoFactory(AppConnectionEntity)

export const appConnectionService = (log: FastifyBaseLogger) => ({
    async upsert(params: UpsertParams): Promise<AppConnectionWithoutSensitiveData> {
        const { projectIds, externalId, value, displayName, pieceName, ownerId, platformId, scope, type } = params

        await assertProjectIds(projectIds, platformId)
        const validatedConnectionValue = await validateConnectionValue({
            value,
            pieceName,
            projectId: projectIds?.[0],
            platformId,
        }, log)

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

    async upsertMissingConnection(params: UpsertPlaceholderParams): Promise<void> {
        const { projectId, platformId, externalId, pieceName, displayName } = params

        const existingConnection = await repo().findOne({
            where: {
                ...(params.projectId ? { projectIds: APArrayContains('projectIds', [params.projectId]) } : {}),
                externalId,
                platformId,
            },
        })

        const connection = {
            displayName,
            status: existingConnection?.status ?? AppConnectionStatus.MISSING,
            externalId,
            pieceName,
            value: encryptUtils.encryptObject({}),
            type: existingConnection?.type ?? AppConnectionType.CUSTOM_AUTH,
            id: existingConnection?.id ?? apId(),
            scope: existingConnection?.scope ?? AppConnectionScope.PROJECT,
            projectIds: existingConnection?.projectIds ?? [projectId],
            platformId,
        }

        await repo().upsert(connection, ['id'])
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
        })

        if (isNil(encryptedAppConnection)) {
            return null
        }
        const connection = await this.decryptAndRefreshConnection(encryptedAppConnection, projectId, log)

        if (isNil(connection)) {
            return null
        }

        const owner = isNil(connection.ownerId) ? null : await userService.getMetaInformation({
            id: connection.ownerId,
        })
        return {
            ...connection,
            owner,
        }
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

    async getManyConnectionStates(params: GetManyParams): Promise<ConnectionState[]> {
        const connections = await repo().find({
            where: {
                projectIds: APArrayContains('projectIds', [params.projectId]),
            },
        })
        return connections.map((connection) => ({
            externalId: connection.externalId,
            pieceName: connection.pieceName,
            displayName: connection.displayName,
        }))
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
        const { data, cursor } = await paginator.paginate(queryBuilder)



        const promises = data.map(async (encryptedConnection) => {
            const apConnection: AppConnection = decryptConnection(encryptedConnection)
            const owner = isNil(apConnection.ownerId) ? null : await userService.getMetaInformation({
                id: apConnection.ownerId,
            })
            return {
                ...apConnection,
                owner,
            }
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
        log: FastifyBaseLogger,
    ): Promise<AppConnection | null> {
        const appConnection = decryptConnection(encryptedAppConnection)
        if (!needRefresh(appConnection, log)) {
            return oauth2Util(log).removeRefreshTokenAndClientSecret(appConnection)
        }

        const refreshedConnection = await lockAndRefreshConnection({ projectId, externalId: appConnection.externalId, log })
        if (isNil(refreshedConnection)) {
            return null
        }
        return oauth2Util(log).removeRefreshTokenAndClientSecret(refreshedConnection)
    },
    async deleteAllProjectConnections(projectId: string) {
        await repo().delete({
            scope: AppConnectionScope.PROJECT,
            projectIds: APArrayContains('projectIds', [projectId]),
        })
    },
    async getOwners({ projectId, platformId }: { projectId: ProjectId, platformId: PlatformId }): Promise<AppConnectionOwners[]> {
        const platformAdmins = (await userService.getByPlatformRole(platformId, PlatformRole.ADMIN)).map(user=>({
            firstName: user.identity.firstName, 
            lastName: user.identity.lastName,
            email: user.identity.email,
        }))
        const projectMembers = await projectMemberService(log).list({
            platformId,
            projectId,
            cursorRequest: null,
            limit: 1000,
            projectRoleId: undefined,
        })
        const projectMembersDetails = projectMembers.data.map(pm=>({
            firstName: pm.user.firstName,
            lastName: pm.user.lastName,
            email: pm.user.email,
        }))
        return [...platformAdmins, ...projectMembersDetails]
    },
})

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
    log: FastifyBaseLogger,
): Promise<AppConnectionValue> => {
    const { value, pieceName, projectId, platformId } = params

    switch (value.type) {
        case AppConnectionType.PLATFORM_OAUTH2: {
            const tokenUrl = await oauth2Util(log).getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            return oauth2Handler[value.type](log).claim({
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
            const tokenUrl = await oauth2Util(log).getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            return oauth2Handler[value.type](log).claim({
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
            const tokenUrl = await oauth2Util(log).getOAuth2TokenUrl({
                projectId,
                pieceName,
                platformId,
                props: value.props,
            })
            const auth = await oauth2Handler[value.type](log).claim({
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
            }, log)
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
            }, log)
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
    log: FastifyBaseLogger,
): Promise<void> => {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    if (environment === ApEnvironment.TESTING) {
        return
    }
    const { pieceName, auth, projectId, platformId } = params

    const pieceMetadata = await pieceMetadataService(log).getOrThrow({
        name: pieceName,
        projectId,
        version: undefined,
        platformId,
    })

    const engineResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperValidateAuthResult>>({
        piece: await getPiecePackageWithoutArchive(log, projectId, platformId, {
            pieceName,
            pieceVersion: pieceMetadata.version,
            pieceType: pieceMetadata.pieceType,
            packageType: pieceMetadata.packageType,
        }),
        projectId,
        platformId,
        connectionValue: auth,
        jobType: UserInteractionJobType.EXECUTE_VALIDATION,
    })

    if (engineResponse.status !== EngineResponseStatus.OK) {
        log.error(
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
    log,
}: {
    projectId: ProjectId
    externalId: string
    log: FastifyBaseLogger
}) {
    const refreshLock = await distributedLock.acquireLock({
        key: `${projectId}_${externalId}`,
        timeout: 20000,
        log,
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
        if (!needRefresh(appConnection, log)) {
            return appConnection
        }
        const refreshedAppConnection = await refresh(appConnection, projectId, log)

        await repo().update(refreshedAppConnection.id, {
            status: AppConnectionStatus.ACTIVE,
            value: encryptUtils.encryptObject(refreshedAppConnection.value),
        })
        return refreshedAppConnection
    }
    catch (e) {
        exceptionHandler.handle(e, log)
        if (!isNil(appConnection) && oauth2Util(log).isUserError(e)) {
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

function needRefresh(connection: AppConnection, log: FastifyBaseLogger): boolean {
    if (connection.status === AppConnectionStatus.ERROR) {
        return false
    }
    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2:
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.OAUTH2:
            return oauth2Util(log).isExpired(connection.value)
        default:
            return false
    }
}

async function refresh(connection: AppConnection, projectId: ProjectId, log: FastifyBaseLogger): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.PLATFORM_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type](log).refresh({
                pieceName: connection.pieceName,
                platformId: connection.platformId,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await oauth2Handler[connection.value.type](log).refresh({
                pieceName: connection.pieceName,
                platformId: connection.platformId,
                projectId,
                connectionValue: connection.value,
            })
            break
        case AppConnectionType.OAUTH2:
            connection.value = await oauth2Handler[connection.value.type](log).refresh({
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

type UpsertPlaceholderParams = {
    projectId: ProjectId
    platformId: string
    externalId: string
    pieceName: string
    displayName: string
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

type GetManyParams = {
    projectId: ProjectId
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
