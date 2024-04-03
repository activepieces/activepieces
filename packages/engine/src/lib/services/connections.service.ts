import { AppConnection, AppConnectionStatus, AppConnectionType, BasicAuthConnectionValue, CloudOAuth2ConnectionValue, OAuth2ConnectionValueWithApp } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { EngineConstants } from '../handler/context/engine-constants'
import { ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ExecutionError, FetchError } from '../helper/execution-errors'

export const createConnectionService = ({ projectId, workerToken }: CreateConnectionServiceParams): ConnectionService => {
    return {
        async obtain(connectionName: string): Promise<ConnectionValue> {
            const url = `${EngineConstants.API_URL}v1/worker/app-connections/${encodeURIComponent(connectionName)}?projectId=${projectId}`

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${workerToken}`,
                    },
                })

                if (!response.ok) {
                    return handleResponseError({
                        connectionName,
                        httpStatus: response.status,
                    })
                }
                const connection: AppConnection = await response.json()
                if (connection.status === AppConnectionStatus.ERROR) {
                    throw new ConnectionExpiredError(connectionName)
                }
                return getConnectionValue(connection)
            }
            catch (e) {
                if (e instanceof ExecutionError) {
                    throw e
                }

                return handleFetchError({
                    url,
                    cause: e,
                })
            }
        },
    }
}

const handleResponseError = ({ connectionName, httpStatus }: HandleResponseErrorParams): never => {
    if (httpStatus === StatusCodes.NOT_FOUND.valueOf()) {
        throw new ConnectionNotFoundError(connectionName)
    }

    throw new ConnectionLoadingError(connectionName)
}

const handleFetchError = ({ url, cause }: HandleFetchErrorParams): never => {
    throw new FetchError(url, cause)
}

const getConnectionValue = (connection: AppConnection): ConnectionValue => {
    switch (connection.value.type) {
        case AppConnectionType.SECRET_TEXT:
            return connection.value.secret_text

        case AppConnectionType.CUSTOM_AUTH:
            return connection.value.props

        default:
            return connection.value
    }
}

type ConnectionValue =
    | OAuth2ConnectionValueWithApp
    | CloudOAuth2ConnectionValue
    | BasicAuthConnectionValue
    | Record<string, unknown>
    | string

type ConnectionService = {
    obtain(connectionName: string): Promise<ConnectionValue>
}

type CreateConnectionServiceParams = {
    projectId: string
    workerToken: string
}

type HandleResponseErrorParams = {
    connectionName: string
    httpStatus: number
}

type HandleFetchErrorParams = {
    url: string
    cause: unknown
}
