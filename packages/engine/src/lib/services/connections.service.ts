import { ContextVersion } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ExecutionError, FetchError } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { utils } from '../utils'
    
export const createConnectionService = ({ projectId, engineToken, apiUrl, contextVersion }: CreateConnectionServiceParams): ConnectionService => {
    return {
        async obtain(externalId: string): Promise<AppConnectionValue> {
            const url = `${apiUrl}v1/worker/app-connections/${encodeURIComponent(externalId)}?projectId=${projectId}`

            const { data: connectionValue, error: connectionValueError } = await utils.tryCatchAndThrowOnEngineError((async () => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${engineToken}`,
                    },
                })

                if (!response.ok) {
                    return handleResponseError({
                        externalId,
                        httpStatus: response.status,
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

const handleResponseError = ({ externalId, httpStatus }: HandleResponseErrorParams): never => {
    if (httpStatus === StatusCodes.NOT_FOUND.valueOf()) {
        throw new ConnectionNotFoundError(externalId)
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
type ConnectionService = {
    obtain(externalId: string): Promise<AppConnectionValue>
}

type CreateConnectionServiceParams = {
    projectId: string
    apiUrl: string
    engineToken: string
    contextVersion: ContextVersion | undefined
}

type HandleResponseErrorParams = {
    externalId: string
    httpStatus: number
}

type HandleFetchErrorParams = {
    url: string
    cause: unknown
}
