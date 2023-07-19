import { StatusCodes } from 'http-status-codes'
import { AppConnectionId, AppConnectionValue, ListAppConnectionRequest, UpsertConnectionRequest } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { appConnectionService } from './app-connection-service'
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'

const DEFAULT_PAGE_SIZE = 10

const filterSensitiveData = (connectionValue: AppConnectionValue): Record<string, unknown> => {
    const sensitiveDataKeys = ['client_secret', 'refresh_token']

    const filteredEntries = Object.entries(connectionValue)
        .filter(([key]) => !sensitiveDataKeys.includes(key))

    return Object.fromEntries(filteredEntries)
}

export const appConnectionController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post(
        '/',
        {
            schema: {
                body: UpsertConnectionRequest,
            },
        },
        async (request) => {
            const connection = await appConnectionService.upsert({ projectId: request.principal.projectId, request: request.body })

            return {
                ...connection,
                value: filterSensitiveData(connection.value),
            }
        },
    )

    app.get(
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

    app.get(
        '/',
        {
            schema: {
                querystring: ListAppConnectionRequest,
            },
        },
        async (request) => {
            const query = request.query
            return await appConnectionService.list({
                projectId: request.principal.projectId,
                appName: query.appName,
                cursorRequest: query.cursor ?? null,
                limit: query.limit ?? DEFAULT_PAGE_SIZE,
            })
        },
    )

    app.delete(
        '/:connectionId',
        async (
            request: FastifyRequest<{
                Params: {
                    connectionId: AppConnectionId
                }
            }>,
            response,
        ) => {
            await appConnectionService.delete({ id: request.params.connectionId, projectId: request.principal.projectId })
            response.status(StatusCodes.OK).send()
        },
    )

    done()
}
