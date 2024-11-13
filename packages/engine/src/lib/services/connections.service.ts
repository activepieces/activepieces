import { AppConnection, AppConnectionStatus, AppConnectionType, BasicAuthConnectionValue, CloudOAuth2ConnectionValue, OAuth2ConnectionValueWithApp } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ExecutionError, FetchError } from '../helper/execution-errors'

export const createConnectionService = ({ projectId, engineToken, apiUrl }: CreateConnectionServiceParams): ConnectionService => {
    return {
        async obtain(externalId: string): Promise<ConnectionValue> {
            const url = `${apiUrl}v1/worker/app-connections/${encodeURIComponent(externalId)}?projectId=${projectId}`

            try {
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

const handleResponseError = ({ externalId, httpStatus }: HandleResponseErrorParams): never => {
    if (httpStatus === StatusCodes.NOT_FOUND.valueOf()) {
        throw new ConnectionNotFoundError(externalId)
    }

    throw new ConnectionLoadingError(externalId)
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
    obtain(externalId: string): Promise<ConnectionValue>
}

type CreateConnectionServiceParams = {
    projectId: string
    apiUrl: string
    engineToken: string
}

type HandleResponseErrorParams = {
    externalId: string
    httpStatus: number
}

type HandleFetchErrorParams = {
    url: string
    cause: unknown
}
