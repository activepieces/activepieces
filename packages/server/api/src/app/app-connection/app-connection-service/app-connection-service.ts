import { AppSystemProp, UserInteractionJobType } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
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
    Metadata,
    OAuth2GrantType,
    PlatformId,
    PlatformRole,
    ProjectId,
    SeekPage,
    spreadIfDefined,
    UpsertAppConnectionRequestBody,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperValidateAuthResult } from 'server-worker'
import { Equal, FindOperator, FindOptionsWhere, ILike, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import { flowService } from '../../flows/flow/flow.service'
import { encryptUtils } from '../../helper/encryption'
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
import { appConnectionHandler } from './app-connection.handler'
import { oauth2Handler } from './oauth2'
import { oauth2Util } from './oauth2/oauth2-util'

export const appConnectionsRepo = repoFactory(AppConnectionEntity)

export const appConnectionService = (log: FastifyBaseLogger) => ({
    async upsert(params: UpsertParams): Promise<AppConnectionWithoutSensitiveData> {
        const { projectIds, externalId, value, displayName, pieceName, ownerId, platformId, scope, type, status, metadata } = params

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

        const existingConnection = await appConnectionsRepo().findOneBy({
            externalId,
            scope,
            platformId,
            ...(projectIds ? APArrayContains('projectIds', projectIds)  : {}),
        })

        const newId = existingConnection?.id ?? apId()
        const connection = {
            displayName,
            ...spreadIfDefined('ownerId', ownerId),
            status: status ?? AppConnectionStatus.ACTIVE,
            value: encryptedConnectionValue,
            externalId,
            pieceName,
            type,
            id: newId,
            scope,
            projectIds,
            platformId,
            ...spreadIfDefined('metadata', metadata),
        }

        await appConnectionsRepo().upsert(connection, ['id'])

        const updatedConnection = await appConnectionsRepo().findOneByOrFail({
            id: newId,
            platformId,
            ...(projectIds ? APArrayContains('projectIds', projectIds)  : {}),
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
            ...(projectIds ? APArrayContains('projectIds', projectIds)  : {}),
        }

        await appConnectionsRepo().update(filter, {
            displayName: request.displayName,
            ...spreadIfDefined('projectIds', request.projectIds),
            ...spreadIfDefined('metadata', request.metadata),
        })

        const updatedConnection = await appConnectionsRepo().findOneByOrFail(filter)
        return this.removeSensitiveData(updatedConnection)
    },
    async getOne({
        projectId,
        platformId,
        externalId,
    }: GetOneByName): Promise<AppConnection | null> {
        const encryptedAppConnection = await appConnectionsRepo().findOne({
            where: {
                ...APArrayContains('projectIds', [projectId]),
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
        const connectionById = await appConnectionsRepo().findOneBy({
            id: params.id,
            platformId: params.platformId,
            ...(params.projectId ? APArrayContains('projectIds', [params.projectId]) : {}),
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
        const connections = await appConnectionsRepo().find({
            where: {
                ...APArrayContains('projectIds', [params.projectId]),
            },
        })
        return connections.map((connection) => ({
            externalId: connection.externalId,
            pieceName: connection.pieceName,
            displayName: connection.displayName,
        }))
    },

    async replace(params: ReplaceParams): Promise<void> {
        const { sourceAppConnectionId, targetAppConnectionId, projectId, platformId, userId } = params
        const sourceAppConnection = await this.getOneOrThrowWithoutValue({
            id: sourceAppConnectionId,
            projectId,
            platformId,
        })
        
        const targetAppConnection = await this.getOneOrThrowWithoutValue({
            id: targetAppConnectionId,
            projectId,
            platformId,
        })
        
        if (sourceAppConnection.pieceName !== targetAppConnection.pieceName) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Connections must be from the same app',
                },
            })
        }

        const flows = await flowService(log).list({
            projectId,
            cursorRequest: null,
            limit: 1000,
            folderId: undefined,
            name: undefined,
            status: undefined,
            connectionExternalIds: [sourceAppConnection.externalId],
        })

        await appConnectionHandler(log).updateFlowsWithAppConnection(flows.data, {
            appConnection: sourceAppConnection,
            newAppConnection: targetAppConnection,
            userId,
        })

        await this.delete({
            id: sourceAppConnection.id,
            platformId,
            scope: sourceAppConnection.scope,
            projectId,
        })
    },

    async delete(params: DeleteParams): Promise<void> {
        await appConnectionsRepo().delete({
            id: params.id,
            platformId: params.platformId,
            scope: params.scope,
            ...(params.projectId ? APArrayContains('projectIds', [params.projectId]) : {}),
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
            ...(projectId ? APArrayContains('projectIds', [projectId]) : {}),
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
        const queryBuilder = appConnectionsRepo()
            .createQueryBuilder('app_connection')
            .where(querySelector)
        const { data, cursor } = await paginator.paginate(queryBuilder)



        const promises = data.map(async (encryptedConnection) => {
            const apConnection: AppConnection = appConnectionHandler(log).decryptConnection(encryptedConnection)
            const owner = isNil(apConnection.ownerId) ? null : await userService.getMetaInformation({
                id: apConnection.ownerId,
            })
            const flowIds = await Promise.all(apConnection.projectIds.map(async (projectId) => {
                const flows = await flowService(log).list({
                    projectId,
                    cursorRequest: null,
                    limit: 1000,
                    folderId: undefined,
                    name: undefined,
                    status: undefined,
                    connectionExternalIds: [apConnection.externalId],
                })
                return flows.data.map((flow) => flow.id)
            }))
            return {
                ...apConnection,
                owner,
                flowIds: flowIds.flat(),
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
        const appConnection = appConnectionHandler(log).decryptConnection(encryptedAppConnection)
        if (!appConnectionHandler(log).needRefresh(appConnection, log)) {
            return oauth2Util(log).removeRefreshTokenAndClientSecret(appConnection)
        }

        const refreshedConnection = await appConnectionHandler(log).lockAndRefreshConnection({ projectId, externalId: appConnection.externalId, log })
        if (isNil(refreshedConnection)) {
            return null
        }
        return oauth2Util(log).removeRefreshTokenAndClientSecret(refreshedConnection)
    },
    async deleteAllProjectConnections(projectId: string) {
        await appConnectionsRepo().delete({
            scope: AppConnectionScope.PROJECT,
            ...APArrayContains('projectIds', [projectId]),
        })
    },
    async getOwners({ projectId, platformId }: { projectId: ProjectId, platformId: PlatformId }): Promise<AppConnectionOwners[]> {
        const platformAdmins = (await userService.getByPlatformRole(platformId, PlatformRole.ADMIN)).map(user => ({
            firstName: user.identity.firstName,
            lastName: user.identity.lastName,
            email: user.identity.email,
        }))
        const edition = system.getOrThrow(AppSystemProp.EDITION)
        if (edition === ApEdition.COMMUNITY) {
            return platformAdmins
        }
        const projectMembers = await projectMemberService(log).list({
            platformId,
            projectId,
            cursorRequest: null,
            limit: 1000,
            projectRoleId: undefined,
        })
        const projectMembersDetails = projectMembers.data.map(pm => ({
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
        case AppConnectionType.NO_AUTH:
            break
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

type UpsertParams = {
    projectIds: ProjectId[]
    ownerId: string | null
    platformId: string
    scope: AppConnectionScope
    externalId: string
    value: UpsertAppConnectionRequestBody['value']
    displayName: string
    type: AppConnectionType
    status?: AppConnectionStatus
    pieceName: string
    metadata?: Metadata
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
        metadata?: Metadata
    }
}

type EngineValidateAuthParams = {
    pieceName: string
    projectId: ProjectId | undefined
    platformId: string
    auth: AppConnectionValue
}

type ReplaceParams = {
    sourceAppConnectionId: AppConnectionId
    targetAppConnectionId: AppConnectionId
    projectId: ProjectId
    platformId: string
    userId: UserId
}