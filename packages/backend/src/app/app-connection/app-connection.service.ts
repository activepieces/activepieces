import {
    ActivepiecesError,
    apId,
    AppConnection,
    AppConnectionId,
    AppConnectionStatus,
    AppConnectionType,
    BaseOAuth2ConnectionValue,
    CloudOAuth2ConnectionValue,
    Cursor,
    ErrorCode,
    OAuth2ConnectionValueWithApp,
    ProjectId,
    SeekPage,
    UpsertConnectionRequest,
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { AppConnectionEntity } from './app-connection.entity'
import axios from 'axios'
import { acquireLock } from '../database/redis-connection'
import { decryptObject, encryptObject } from '../helper/encryption'
import { getEdition } from '../helper/secret-helper'
import { logger } from '../helper/logger'
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'

type GetOneParams = {
    projectId: ProjectId
    name: string
}

const appConnectionRepo = databaseConnection.getRepository(AppConnectionEntity)

export const appConnectionService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertConnectionRequest }): Promise<AppConnection> {
        let response: Record<string, unknown> = request.value
        switch (request.value.type) {
            case AppConnectionType.CLOUD_OAUTH2:
                response = await claimWithCloud({
                    pieceName: request.appName,
                    code: request.value.code,
                    clientId: request.value.client_id,
                    tokenUrl: request.value.token_url!,
                    edition: await getEdition(),
                    authorizationMethod: request.value.authorization_method!,
                    codeVerifier: request.value.code_challenge!,
                })
                break
            case AppConnectionType.OAUTH2:
                response = await claim({
                    clientSecret: request.value.client_secret,
                    clientId: request.value.client_id,
                    tokenUrl: request.value.token_url,
                    redirectUrl: request.value.redirect_url,
                    code: request.value.code,
                    authorizationMethod: request.value.authorization_method,
                    codeVerifier: request.value.code_challenge!,
                })
                break
            default:
                break
        }
        const claimedUpsertRequest = { ...request, value: { ...response, ...request.value }, id: apId(), projectId }
        await appConnectionRepo.upsert({ ...claimedUpsertRequest, id: apId(), projectId: projectId, value: encryptObject(claimedUpsertRequest.value) }, ['name', 'projectId'])
        const connection = await appConnectionRepo.findOneByOrFail({
            projectId: projectId,
            name: request.name,
        })
        connection.value = decryptObject(connection.value)
        return connection
    },

    async getOne({ projectId, name }: GetOneParams): Promise<AppConnection | null> {
        const appConnection = await appConnectionRepo.findOneBy({
            projectId: projectId,
            name: name,
        })
        if (appConnection === null) {
            return null
        }
        // We should make sure this is accessed only once, as a race condition could occur where the token needs to be refreshed and it gets accessed at the same time,
        // which could result in the wrong request saving incorrect data.
        const refreshLock = await acquireLock({
            key: `${projectId}_${name}`,
            timeout: 10000,
        })
        try {

            appConnection.value = decryptObject(appConnection.value)
            const refreshedAppConnection = await refresh(appConnection)
            await appConnectionRepo.update(refreshedAppConnection.id, { ...refreshedAppConnection, value: encryptObject(refreshedAppConnection.value) })
            refreshedAppConnection.status = getStatus(refreshedAppConnection)
            return refreshedAppConnection
        }
        catch (e) {
            logger.error(e)
            appConnection.status = AppConnectionStatus.ERROR
        }
        finally {
            await refreshLock.release()
        }
        return appConnection
    },

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
    },

    async delete({ projectId, id }: { projectId: ProjectId, id: AppConnectionId }): Promise<void> {
        await appConnectionRepo.delete({ id: id, projectId: projectId })
    },
    async list(projectId: ProjectId, appName: string | undefined, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppConnection>> {
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
        let queryBuilder = appConnectionRepo.createQueryBuilder('app_connection').where({ projectId })
        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName })
        }
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const promises: Promise<AppConnection>[] = []
        data.forEach(connection => {
            try {
                connection.value = decryptObject(connection.value)
                connection.status = getStatus(connection)
                if (connection.status === AppConnectionStatus.ACTIVE) {
                    promises.push(new Promise((resolve) => {
                        return resolve(connection)
                    }))
                }
                else {
                    promises.push(this.getOneOrThrow({ projectId: connection.projectId, name: connection.name }))
                }
            }
            catch (e) {
                connection.status = AppConnectionStatus.ERROR
                promises.push(new Promise((resolve) => {
                    return resolve(connection)
                }))
            }
        })
        const refreshConnections = await Promise.all(promises)
        return paginationHelper.createPage<AppConnection>(refreshConnections, cursor)
    },
}

async function refresh(connection: AppConnection): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await refreshCloud(connection.appName, connection.value)
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
    return (secondsSinceEpoch + REFRESH_THRESHOLD >= connection.claimed_at + expiresIn)
}

async function refreshCloud(appName: string, connectionValue: CloudOAuth2ConnectionValue): Promise<CloudOAuth2ConnectionValue> {
    if (!isExpired(connectionValue)) {
        return connectionValue
    }

    const requestBody = {
        refreshToken: connectionValue.refresh_token,
        pieceName: appName,
        clientId: connectionValue.client_id,
        edition: await getEdition(),
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

async function refreshWithCredentials(appConnection: OAuth2ConnectionValueWithApp): Promise<OAuth2ConnectionValueWithApp> {
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
    const authorizationMethod = appConnection.authorization_method || OAuth2AuthorizationMethod.BODY
    switch (authorizationMethod) {
        case OAuth2AuthorizationMethod.BODY:
            body.client_id = appConnection.client_id
            body.client_secret = appConnection.client_secret
            break
        case OAuth2AuthorizationMethod.HEADER:
            headers.authorization = `Basic ${Buffer.from(`${appConnection.client_id}:${appConnection.client_secret}`).toString('base64')}`
            break
        default:
            throw new Error(`Unknown authorization method: ${authorizationMethod}`)
    }
    const response = (
        await axios.post(
            appConnection.token_url,
            new URLSearchParams(body),
            {
                headers: headers,
            },
        )
    ).data
    const mergedObject = mergeNonNull(appConnection, formatOAuth2Response({ ...response }))
    return mergedObject
}

/*
When the refresh token is null or undefined, it indicates that the original connection's refresh token is also null or undefined.
Therefore, we only need to merge non-null values to avoid overwriting the original refresh token with a null or undefined value.
*/
function mergeNonNull(appConnection: OAuth2ConnectionValueWithApp, oAuth2Response: BaseOAuth2ConnectionValue): OAuth2ConnectionValueWithApp {
    const formattedOAuth2Response: Partial<BaseOAuth2ConnectionValue> = Object.entries(oAuth2Response)
        .filter(([, value]) => value !== null && value !== undefined)
        .reduce<Partial<BaseOAuth2ConnectionValue>>((obj, [key, value]) => {
        obj[key as keyof BaseOAuth2ConnectionValue] = value
        return obj
    }, {})
  
    return { ...appConnection, ...formattedOAuth2Response } as OAuth2ConnectionValueWithApp
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
        const authorizationMethod = request.authorizationMethod || OAuth2AuthorizationMethod.BODY
        switch (authorizationMethod) {
            case OAuth2AuthorizationMethod.BODY:
                body.client_id = request.clientId
                body.client_secret = request.clientSecret
                break
            case OAuth2AuthorizationMethod.HEADER:
                headers.authorization = `Basic ${Buffer.from(`${request.clientId}:${request.clientSecret}`).toString('base64')}`
                break
            default:
                throw new Error(`Unknown authorization method: ${authorizationMethod}`)
        }
        const response = (
            await axios.post(
                request.tokenUrl,
                new URLSearchParams(body),
                {
                    headers: headers,
                },
            )
        ).data
        return { ...formatOAuth2Response(response), client_id: request.clientId, client_secret: request.clientSecret, authorization_method: authorizationMethod }
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLAIM, params: {
                clientId: request.clientId,
                tokenUrl: request.tokenUrl,
                redirectUrl: request.redirectUrl,
            },
        })
    }
}

async function claimWithCloud(request: claimWithCloudRequest): Promise<Record<string, unknown>> {
    try {
        return (await axios.post('https://secrets.activepieces.com/claim', request)).data
    }
    catch (e: unknown) {
        logger.error(e)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CLOUD_CLAIM, params: {
                appName: request.pieceName,
            },
        })
    }
}

type UnformattedOauthResponse = {
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    token_type: string
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

    deleteProps(formattedResponse.data, ['access_token', 'access_token', 'expires_in', 'refresh_token', 'scope', 'token_type'])
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

type claimWithCloudRequest = {
    pieceName: string
    code: string
    codeVerifier: string
    authorizationMethod: OAuth2AuthorizationMethod
    edition: string
    clientId: string
    tokenUrl: string
}
