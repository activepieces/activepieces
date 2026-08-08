import { ContextVersion } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, ConnectionBlockedForGenericPieceError, ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ConnectionPieceBindingMismatchError, ErrorCode, ExecutionError, FetchError } from '@activepieces/shared'
import { utils } from '../utils'

export const createConnectionResolver = ({ projectId, engineToken, internalEngineToken, apiUrl, contextVersion, requestingPieceName }: CreateConnectionResolverParams): ConnectionResolver => {
    return {
        async obtain(externalId: string): Promise<AppConnectionValue> {
            const requestingPieceNameParam = requestingPieceName === undefined ? '' : `&requestingPieceName=${encodeURIComponent(requestingPieceName)}`
            const url = `${apiUrl}v1/worker/app-connections/${encodeURIComponent(externalId)}?projectId=${projectId}${requestingPieceNameParam}`

            const { data: connectionValue, error: connectionValueError } = await utils.tryCatchAndThrowOnEngineError((async () => {
                const headers: Record<string, string> = {
                    Authorization: `Bearer ${engineToken}`,
                }
                if (internalEngineToken !== undefined) {
                    headers['x-ap-internal-engine-token'] = internalEngineToken
                }
                const response = await fetch(url, {
                    method: 'GET',
                    headers,
                })

                if (!response.ok) {
                    const errorBody: ErrorResponseBody | undefined = await response.json().catch(() => undefined)
                    return handleResponseError({
                        externalId,
                        httpStatus: response.status,
                        errorCode: errorBody?.code,
                        errorParams: errorBody?.params,
                    })
                }
                const connection: AppConnection = await response.json()
                if (connection.status === AppConnectionStatus.ERROR) {
                    throw new ConnectionExpiredError(externalId)
                }
                return getConnectionValue(connection, contextVersion)
            }))

            if (connectionValueError) {
                if (connectionValueError instanceof ExecutionError) {
                    throw connectionValueError
                }
                return handleFetchError({
                    url,
                    cause: connectionValueError,
                })
            }
            return connectionValue
        },
    }
}

const handleResponseError = ({ externalId, httpStatus, errorCode, errorParams }: HandleResponseErrorParams): never => {
    if (httpStatus === 404) {
        throw new ConnectionNotFoundError(externalId)
    }
    if (errorCode === ErrorCode.APP_CONNECTION_PIECE_BINDING_MISMATCH) {
        throw new ConnectionPieceBindingMismatchError(externalId, errorParams?.connectionPieceName, errorParams?.requestingPieceName)
    }
    if (errorCode === ErrorCode.APP_CONNECTION_BLOCKED_FOR_PIECE) {
        throw new ConnectionBlockedForGenericPieceError(externalId, errorParams?.pieceName)
    }

    throw new ConnectionLoadingError(externalId)
}

const handleFetchError = ({ url, cause }: HandleFetchErrorParams): never => {
    throw new FetchError(url, cause)
}

const getConnectionValue = (connection: AppConnection, contextVersion: ContextVersion | undefined): AppConnectionValue => {
    switch (contextVersion) {
        case undefined:
            return makeConnectionValueCompatibleWithContextV0(connection)
        case ContextVersion.V1:
            return connection.value
        default:
            return connection.value
    }
}

function makeConnectionValueCompatibleWithContextV0(connection: AppConnection): AppConnectionValue {
    switch (connection.value.type) {
        case AppConnectionType.SECRET_TEXT:
            return connection.value.secret_text as unknown as AppConnectionValue

        case AppConnectionType.CUSTOM_AUTH:
            return connection.value.props as unknown as AppConnectionValue
        default:
            return connection.value as unknown as AppConnectionValue
    }
}

type ConnectionResolver = {
    obtain(externalId: string): Promise<AppConnectionValue>
}

type CreateConnectionResolverParams = {
    projectId: string
    apiUrl: string
    engineToken: string
    internalEngineToken?: string
    contextVersion: ContextVersion | undefined
    requestingPieceName: string | undefined
}

type ErrorResponseBody = {
    code?: string
    params?: {
        connectionPieceName?: string
        requestingPieceName?: string
        pieceName?: string
    }
}

type HandleResponseErrorParams = {
    externalId: string
    httpStatus: number
    errorCode: string | undefined
    errorParams: ErrorResponseBody['params']
}

type HandleFetchErrorParams = {
    url: string
    cause: unknown
}
