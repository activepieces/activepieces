import { FastifyInstance, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { AppConnectionId, AppConnectionValue, ListAppConnectionRequest, UpsertConnectionRequest } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { appConnectionService } from './app-connection.service'

const DEFAULT_PAGE_SIZE = 10

const filterSensitiveData = (connectionValue: AppConnectionValue): Record<string, unknown> => {
    const sensitiveDataKeys = ['client_secret', 'refresh_token']

    const filteredEntries = Object.entries(connectionValue)
        .filter(([key]) => !sensitiveDataKeys.includes(key))

    return Object.fromEntries(filteredEntries)
}

export const appConnectionController = async (fastify: FastifyInstance) => {

    fastify.post(
        '/',
        {
            schema: {
                body: UpsertConnectionRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: UpsertConnectionRequest
            }>,
        ) => {
            const connection = await appConnectionService.upsert({ projectId: request.principal.projectId, request: request.body })

            return {
                ...connection,
                value: filterSensitiveData(connection.value),
            }
        },
    )


    fastify.get(
        '/:connectionName',
        async (
            request: FastifyRequest<{
                Params: {
                    connectionName: string
                }
            }>,
        ) => {
            const appCredential = await appConnectionService.getOne({ projectId: request.principal.projectId, name: request.params.connectionName })
            if (appCredential === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.APP_CONNECTION_NOT_FOUND,
                    params: { id: request.params.connectionName },
                })
            }

            return {
                ...appCredential,
                value: filterSensitiveData(appCredential.value),
            }
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListAppConnectionRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListAppConnectionRequest
            }>,
        ) => {
            const query = request.query
            return await appConnectionService.list(request.principal.projectId,
                query.appName,
                query.cursor ?? null, query.limit ?? DEFAULT_PAGE_SIZE)
        },
    )

    fastify.delete(
        '/:connectionId',
        async (
            request: FastifyRequest<{
                Params: {
                    connectionId: AppConnectionId
                }
            }>,
            _reply,
        ) => {
            await appConnectionService.delete({ id: request.params.connectionId, projectId: request.principal.projectId })
            _reply.status(StatusCodes.OK).send()
        },
    )
}
