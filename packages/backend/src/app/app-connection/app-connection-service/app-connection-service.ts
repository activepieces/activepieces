import {
    ActivepiecesError,
    apId,
    AppConnection,
    AppConnectionId,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionValue,
    BaseOAuth2ConnectionValue,
    CloudOAuth2ConnectionValue,
    Cursor,
    EngineResponseStatus,
    ErrorCode,
    ExecuteValidateAuthOperation,
    OAuth2ConnectionValueWithApp,
    ProjectId,
    SeekPage,
    UpsertConnectionRequest,
} from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import {
    AppConnectionEntity,
    AppConnectionSchema,
} from '../app-connection.entity'
import axios from 'axios'
import { decryptObject, encryptObject } from '../../helper/encryption'
import { getEdition } from '../../helper/secret-helper'
import { logger } from '../../helper/logger'
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'
import { acquireLock } from '../../helper/lock'

const repo = databaseConnection.getRepository(AppConnectionEntity)

export class AppConnectionService {
    protected async preUpsertHook(_params: UpsertParams): Promise<void> {
        return Promise.resolve()
    }

    async upsert(params: UpsertParams): Promise<AppConnection> {
        await this.preUpsertHook(params)

        const { projectId, request } = params

        const validatedConnectionValue = await validateConnectionValue({
            connection: request,
            projectId,
        })

        const encryptedConnectionValue = encryptObject({
            ...validatedConnectionValue,
            ...request.value,
        })

        const connection = {
            ...request,
            value: encryptedConnectionValue,
            id: apId(),
            projectId,
        }

        await repo.upsert(connection, ['name', 'projectId'])

        const updatedConnection = await repo.findOneByOrFail({
            name: request.name,
            projectId,
        })
        return decryptConnection(updatedConnection)
    }

    async getOne({ projectId, name }: GetOneParams): Promise<AppConnection | null> {
        const encryptedAppConnection = await repo.findOneBy({
            projectId,
            name,
        })

        if (isNil(encryptedAppConnection)) {
            return encryptedAppConnection
        }

        const appConnection = decryptConnection(encryptedAppConnection)

        if (!needRefresh(appConnection)) {
            appConnection.status = getStatus(appConnection)
            return appConnection
        }

        return lockAndRefreshConnection({ projectId, name })
    }

    async getOneOrThrow(params: GetOneParams): Promise<AppConnection> {
        const connection = await this.getOne(params)

        if (isNil(connection)) {
            throw new ActivepiecesError({
                code: ErrorCode.APP_CONNECTION_NOT_FOUND,
                params: {
                    id: params.name,
                },
            })
        }

        return connection
    }

    async delete(params: DeleteParams): Promise<void> {
        await repo.delete(params)
    }

    async list({ projectId, appName, cursorRequest, limit }: ListParams): Promise<SeekPage<AppConnection>> {
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

        let queryBuilder = repo
            .createQueryBuilder('app_connection')
            .where({ projectId })

        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName })
        }

        const { data, cursor } = await paginator.paginate(queryBuilder)
        const promises: Promise<AppConnection>[] = []

        data.forEach((encryptedConnection) => {
            const apConnection: AppConnection =
                decryptConnection(encryptedConnection)
            try {
                if (apConnection.status === AppConnectionStatus.ACTIVE) {
                    promises.push(
                        new Promise((resolve) => {
                            return resolve(apConnection)
                        }),
                    )
                }
                else {
                    promises.push(
                        this.getOneOrThrow({
                            projectId: apConnection.projectId,
                            name: apConnection.name,
                        }),
                    )
                }
            }
            catch (e) {
                apConnection.status = AppConnectionStatus.ERROR
                promises.push(
                    new Promise((resolve) => {
                        return resolve(apConnection)
                    }),
                )
            }
        })

        const refreshConnections = await Promise.all(promises)

        return paginationHelper.createPage<AppConnection>(
            refreshConnections,
            cursor,
        )
    }

    async countByProject({ projectId }: CountByProjectParams): Promise<number> {
        return await repo.countBy({ projectId })
    }
}

const validateConnectionValue = async (
    params: ValidateConnectionValueParams,
): Promise<Record<string, unknown>> => {
    const { connection, projectId } = params

    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
            return claimWithCloud({
                pieceName: connection.appName,
                code: connection.value.code,
                clientId: connection.value.client_id,
                tokenUrl: connection.value.token_url!,
                edition: getEdition(),
                authorizationMethod: connection.value.authorization_method!,
                codeVerifier: connection.value.code_challenge!,
            })

        case AppConnectionType.OAUTH2:
            return claim({
                clientSecret: connection.value.client_secret,
                clientId: connection.value.client_id,
                tokenUrl: connection.value.token_url,
                redirectUrl: connection.value.redirect_url,
                code: connection.value.code,
                authorizationMethod: connection.value.authorization_method,
                codeVerifier: connection.value.code_challenge!,
            })

        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.SECRET_TEXT:
            await engineValidateAuth({
                pieceName: connection.appName,
                projectId,
                auth: connection.value,
            })
    }

    return connection.value
}

function decryptConnection(
    encryptedConnection: AppConnectionSchema,
): AppConnection {
    const value = decryptObject<AppConnectionValue>(encryptedConnection.value)
    let connection: AppConnection
    switch (value.type) {
        case AppConnectionType.BASIC_AUTH:
            connection = {
                ...encryptedConnection,
                status: AppConnectionStatus.ACTIVE,
                value,
            }
            break
        case AppConnectionType.CLOUD_OAUTH2:
            connection = {
                ...encryptedConnection,
                status: AppConnectionStatus.ACTIVE,
                value,
            }
            break
        case AppConnectionType.CUSTOM_AUTH:
            connection = {
                ...encryptedConnection,
                status: AppConnectionStatus.ACTIVE,
                value,
            }
            break
        case AppConnectionType.OAUTH2:
            connection = {
                ...encryptedConnection,
                status: AppConnectionStatus.ACTIVE,
                value,
            }
            break
        case AppConnectionType.SECRET_TEXT:
            connection = {
                ...encryptedConnection,
                status: AppConnectionStatus.ACTIVE,
                value,
            }
            break
    }
    connection.status = getStatus(connection)
    return connection
}

const engineValidateAuth = async (
    params: EngineValidateAuthParams,
): Promise<void> => {
    const { pieceName, auth, projectId } = params

    const engineInput: ExecuteValidateAuthOperation = {
        pieceName,
        pieceVersion: 'latest',
        auth,
        projectId,
    }

    const engineResponse = await engineHelper.executeValidateAuth(engineInput)

    if (engineResponse.status !== EngineResponseStatus.OK) {
        logger.error(
            engineResponse,
            '[AppConnectionService#engineValidateAuth] engineResponse',
        )
        throw new ActivepiecesError({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            params: {
                message: 'failed to run validateAuth',
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
            id: refreshedAppConnection.id,
            name: refreshedAppConnection.name,
            appName: refreshedAppConnection.appName,
            projectId: refreshedAppConnection.projectId,
            value: encryptObject(refreshedAppConnection.value),
        })
        refreshedAppConnection.status = getStatus(refreshedAppConnection)
        return refreshedAppConnection
    }
    catch (e) {
        logger.error(e)
        if (!isNil(appConnection)) {
            appConnection.status = AppConnectionStatus.ERROR
        }
    }
    finally {
        await refreshLock.release()
    }
    return appConnection
}

function needRefresh(connection: AppConnection): boolean {
    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.OAUTH2:
            return isExpired(connection.value)
        default:
            return false
    }
}

async function refresh(connection: AppConnection): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await refreshCloud(
                connection.appName,
                connection.value,
            )
            break
        case AppConnectionType.OAUTH2:
            connection.value = await refreshWithCredentials(connection.value)
            break
        default:
            break
    }
    return connection
}

const REFRESH_THRESHOLD = 15 * 60 // Refresh if there is less than 15 minutes to expire

function isExpired(connection: BaseOAuth2ConnectionValue) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000)

    if (!connection.refresh_token) {
        return false
    }
    // Salesforce doesn't provide an 'expires_in' field, as it is dynamic per organization; therefore, it's necessary for us to establish a low threshold and consistently refresh it.
    const expiresIn = connection.expires_in ?? 60 * 60
    return (
        secondsSinceEpoch + REFRESH_THRESHOLD >= connection.claimed_at + expiresIn
    )
}

async function refreshCloud(
    appName: string,
    connectionValue: CloudOAuth2ConnectionValue,
): Promise<CloudOAuth2ConnectionValue> {
    if (!isExpired(connectionValue)) {
        return connectionValue
    }

    const requestBody = {
        refreshToken: connectionValue.refresh_token,
        pieceName: appName,
        clientId: connectionValue.client_id,
        edition: getEdition(),
        authorizationMethod: connectionValue.authorization_method,
        tokenUrl: connectionValue.token_url,
    }
    const response = (
        await axios.post('https://secrets.activepieces.com/refresh', requestBody)
    ).data

    return {
        ...connectionValue,
        ...response,
        type: AppConnectionType.CLOUD_OAUTH2,
    }
}

async function refreshWithCredentials(
    appConnection: OAuth2ConnectionValueWithApp,
): Promise<OAuth2ConnectionValueWithApp> {
    if (!isExpired(appConnection)) {
        return appConnection
    }
    const body: Record<string, string> = {
        redirect_uri: appConnection.redirect_url,
        grant_type: 'refresh_token',
        refresh_token: appConnection.refresh_token,
    }
    const headers: Record<string, string> = {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
    }
    const authorizationMethod =
        appConnection.authorization_method || OAuth2AuthorizationMethod.BODY
    switch (authorizationMethod) {
        case OAuth2AuthorizationMethod.BODY:
            body.client_id = appConnection.client_id
            body.client_secret = appConnection.client_secret
            break
        case OAuth2AuthorizationMethod.HEADER:
            headers.authorization = `Basic ${Buffer.from(
                `${appConnection.client_id}:${appConnection.client_secret}`,
            ).toString('base64')}`
            break
        default:
            throw new Error(`Unknown authorization method: ${authorizationMethod}`)
    }
    const response = (
        await axios.post(appConnection.token_url, new URLSearchParams(body), {
            headers,
        })
    ).data
    const mergedObject = mergeNonNull(
        appConnection,
        formatOAuth2Response({ ...response }),
    )
    return mergedObject
}

/**
 * When the refresh token is null or undefined, it indicates that the original connection's refresh token is also null
 * or undefined. Therefore, we only need to merge non-null values to avoid overwriting the original refresh token with a
 *  null or undefined value.
*/
function mergeNonNull(
    appConnection: OAuth2ConnectionValueWithApp,
    oAuth2Response: BaseOAuth2ConnectionValue,
): OAuth2ConnectionValueWithApp {
    const formattedOAuth2Response: Partial<BaseOAuth2ConnectionValue> =
        Object.entries(oAuth2Response)
            .filter(([, value]) => value !== null && value !== undefined)
            .reduce<Partial<BaseOAuth2ConnectionValue>>((obj, [key, value]) => {
            obj[key as keyof BaseOAuth2ConnectionValue] = value
            return obj
        }, {})

    return {
        ...appConnection,
        ...formattedOAuth2Response,
    } as OAuth2ConnectionValueWithApp
}

async function claim(request: {
    clientSecret: string
    clientId: string
    tokenUrl: string
    redirectUrl: string
    code: string
    authorizationMethod?: OAuth2AuthorizationMethod
    codeVerifier: string
}): Promise<Record<string, unknown>> {
    try {
        const body: Record<string, string> = {
            redirect_uri: request.redirectUrl,
            grant_type: 'authorization_code',
            code: request.code,
        }
        if (request.codeVerifier) {
            body.code_verifier = request.codeVerifier
        }
        const headers: Record<string, string> = {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
        }
        const authorizationMethod =
            request.authorizationMethod || OAuth2AuthorizationMethod.BODY
        switch (authorizationMethod) {
            case OAuth2AuthorizationMethod.BODY:
                body.client_id = request.clientId
                body.client_secret = request.clientSecret
                break
            case OAuth2AuthorizationMethod.HEADER:
                headers.authorization = `Basic ${Buffer.from(
                    `${request.clientId}:${request.clientSecret}`,
                ).toString('base64')}`
                break
            default:
                throw new Error(`Unknown authorization method: ${authorizationMethod}`)
        }
        const response = (
            await axios.post(request.tokenUrl, new URLSearchParams(body), {
                headers,
            })
        ).data
        return {
            ...formatOAuth2Response(response),
            client_id: request.clientId,
            client_secret: request.clientSecret,
            authorization_method: authorizationMethod,
        }
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLAIM,
            params: {
                clientId: request.clientId,
                tokenUrl: request.tokenUrl,
                redirectUrl: request.redirectUrl,
            },
        })
    }
}

async function claimWithCloud(
    request: claimWithCloudRequest,
): Promise<Record<string, unknown>> {
    try {
        return (await axios.post('https://secrets.activepieces.com/claim', request))
            .data
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLOUD_CLAIM,
            params: {
                appName: request.pieceName,
            },
        })
    }
}

function formatOAuth2Response(response: UnformattedOauthResponse) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000)
    const formattedResponse: BaseOAuth2ConnectionValue = {
        access_token: response.access_token,
        expires_in: response.expires_in,
        claimed_at: secondsSinceEpoch,
        refresh_token: response.refresh_token,
        scope: response.scope,
        token_type: response.token_type,
        data: response,
    }

    deleteProps(formattedResponse.data, [
        'access_token',
        'expires_in',
        'refresh_token',
        'scope',
        'token_type',
    ])
    return formattedResponse
}

function deleteProps(obj: Record<string, unknown>, prop: string[]) {
    for (const p of prop) {
        delete obj[p]
    }
}

function getStatus(connection: AppConnection): AppConnectionStatus {
    const connectionStatus = AppConnectionStatus.ACTIVE
    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.OAUTH2:
            if (isExpired(connection.value)) {
                return AppConnectionStatus.EXPIRED
            }
            break
        default:
            break
    }
    return connectionStatus
}



type UpsertParams = {
    projectId: ProjectId
    request: UpsertConnectionRequest
}

type GetOneParams = {
    projectId: ProjectId
    name: string
}

type DeleteParams = {
    projectId: ProjectId
    id: AppConnectionId
}

type ListParams = {
    projectId: ProjectId
    appName: string | undefined
    cursorRequest: Cursor | null
    limit: number
}

type CountByProjectParams = {
    projectId: ProjectId
}

type claimWithCloudRequest = {
    pieceName: string
    code: string
    codeVerifier: string
    authorizationMethod: OAuth2AuthorizationMethod
    edition: string
    clientId: string
    tokenUrl: string
}

type EngineValidateAuthParams = {
    pieceName: string
    projectId: ProjectId
    auth: unknown
}

type ValidateConnectionValueParams = {
    connection: UpsertConnectionRequest
    projectId: ProjectId
}

type UnformattedOauthResponse = {
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    token_type: string
}
