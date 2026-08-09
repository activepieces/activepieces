import { isNil, tryCatch } from '@activepieces/core-utils'
import { ContextVersion } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionStatus, AppConnectionType, AppConnectionValue, ConnectionExpiredError, ConnectionLoadingError, ConnectionNotFoundError, ConnectionPieceMismatchError, ErrorCode, ExecutionError, FetchError } from '@activepieces/shared'
import { utils } from '../utils'

export const createConnectionResolver = ({ projectId, engineToken, apiUrl, contextVersion, pieceName }: CreateConnectionResolverParams): ConnectionResolver => {
    return {
        async obtain(externalId: string): Promise<AppConnectionValue> {
            const url = `${apiUrl}v1/worker/app-connections/${encodeURIComponent(externalId)}?projectId=${projectId}${isNil(pieceName) ? '' : `&pieceName=${encodeURIComponent(pieceName)}`}`

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
                        pieceName,
                        response,
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

const handleResponseError = async ({ externalId, pieceName, response }: HandleResponseErrorParams): Promise<never> => {
    if (response.status === 404) {
        throw new ConnectionNotFoundError(externalId)
    }
    if (!isNil(pieceName) && await isPieceMismatchResponse(response)) {
        throw new ConnectionPieceMismatchError(externalId, pieceName)
    }

    throw new ConnectionLoadingError(externalId)
}

const isPieceMismatchResponse = async (response: Response): Promise<boolean> => {
    const { data: body } = await tryCatch<{ code?: string }, Error>(() => response.json())
    return body?.code === ErrorCode.MCP_PIECE_CONNECTION_MISMATCH
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
    contextVersion: ContextVersion | undefined
    pieceName?: string
}

type HandleResponseErrorParams = {
    externalId: string
    pieceName: string | undefined
    response: Response
}

type HandleFetchErrorParams = {
    url: string
    cause: unknown
}
