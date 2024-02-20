import { StatusCodes } from 'http-status-codes'
import { AppConnection, AppConnectionType, CloudOAuth2ConnectionValue, BasicAuthConnectionValue, OAuth2ConnectionValueWithApp, isNil } from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { ConnectionLoadingFailureError, ConnectionNotFoundError } from '../helper/execution-errors'

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
                    return handleErrors({
                        httpStatus: response.status,
                        connectionName,
                        url,
                    })
                }

                const connection: AppConnection | null = await response.json()

                if (isNil(connection)) {
                    return handleNotFoundError(connectionName)
                }

                return getConnectionValue(connection)
            }
            catch (e) {
                if (e instanceof ConnectionNotFoundError) {
                    throw e
                }

                return handleErrors({
                    connectionName,
                    url,
                })
            }
        },
    }
}

const handleErrors = ({ httpStatus, connectionName, url }: HandleErrorsParams): never => {
    if (httpStatus === StatusCodes.NOT_FOUND.valueOf()) {
        handleNotFoundError(connectionName)
    }

    throw new ConnectionLoadingFailureError(connectionName, url)
}

const handleNotFoundError = (connectionName: string): never => {
    throw new ConnectionNotFoundError(connectionName)
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

type HandleErrorsParams = {
    httpStatus?: number
    connectionName: string
    url: string
}
