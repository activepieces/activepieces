import { BaseContext, ContextVersion, InputPropertyMap, PieceAuthProperty, PropertyType } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionStatus, AppConnectionType, isNil } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ExecutionError, FetchError } from '../helper/execution-errors'
import { utils } from '../utils'
    
export const createConnectionService = ({ projectId, engineToken, apiUrl, contextVersion }: CreateConnectionServiceParams): ConnectionService => {
    return {
        async obtain(externalId: string): Promise<ConnectionValue> {
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

const getConnectionValue = (connection: AppConnection, contextVersion: ContextVersion | undefined): ConnectionValue => {
    //for backward compatibility, we need to return the connection value as is
    if (isNil(contextVersion)) {
        switch (connection.value.type) {
            case AppConnectionType.SECRET_TEXT:
                return connection.value.secret_text as unknown as ConnectionValue
    
            case AppConnectionType.CUSTOM_AUTH:
                return connection.value.props as unknown as ConnectionValue
    
            default:
                return connection.value as unknown as ConnectionValue
        }
    }
    switch (connection.value.type) {
        case AppConnectionType.SECRET_TEXT:
            return {
                type: PropertyType.SECRET_TEXT,
                value: {
                    secretText: connection.value.secret_text,
                },
            }
        case AppConnectionType.CUSTOM_AUTH:
            return {
                type: PropertyType.CUSTOM_AUTH,
                value: connection.value.props,
            }
        case AppConnectionType.BASIC_AUTH:
            return {
                type: PropertyType.BASIC_AUTH,
                value: connection.value,
            }
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.PLATFORM_OAUTH2:
        case AppConnectionType.OAUTH2:
            return {
                type: PropertyType.OAUTH2,
                value: connection.value,
            }
        case AppConnectionType.NO_AUTH:
            return {
                type: PropertyType.CUSTOM_AUTH,
                value: {},
            }
    }
}

type ConnectionService = {
    obtain(externalId: string): Promise<ConnectionValue>
}
type ConnectionValue = BaseContext<PieceAuthProperty, InputPropertyMap>['auth']

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
