import {
    ActivepiecesError,
    ApId,
    AppConnection,
    AppConnectionWithoutSensitiveData,
    ErrorCode,
    ListAppConnectionsRequestQuery,
    SeekPage,
    UpsertAppConnectionRequestBody,
    isNil,
} from '@activepieces/shared'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', UpsertAppConnectionRequest, async (request): Promise<AppConnectionWithoutSensitiveData> => {
        const appConnection = await appConnectionService.upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })

        return removeSensitiveData(appConnection)
    })

    app.get('/:connectionName', GetAppConnectionRequest, async (request): Promise<AppConnectionWithoutSensitiveData> => {
        const appConnection = await appConnectionService.getOne({
            projectId: request.principal.projectId,
            name: request.params.connectionName,
        })

        if (isNil(appConnection)) {
            throw new ActivepiecesError({
                code: ErrorCode.APP_CONNECTION_NOT_FOUND,
                params: {
                    id: request.params.connectionName,
                },
            })
        }

        return removeSensitiveData(appConnection)
    })

    app.get('/', ListAppConnectionsRequest, async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
        const { appName, cursor, limit } = request.query

        const appConnections = await appConnectionService.list({
            projectId: request.principal.projectId,
            appName,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
        })

        const appConnectionsWithoutSensitiveData: SeekPage<AppConnectionWithoutSensitiveData> = {
            ...appConnections,
            data: appConnections.data.map(removeSensitiveData),
        }

        return appConnectionsWithoutSensitiveData
    })

    app.delete('/:connectionId', DeleteAppConnectionRequest, async (request): Promise<void> => {
        await appConnectionService.delete({
            id: request.params.connectionId,
            projectId: request.principal.projectId,
        })
    })

    done()
}

const DEFAULT_PAGE_SIZE = 10

const removeSensitiveData = (appConnection: AppConnection): AppConnectionWithoutSensitiveData => {
    const { value: _, ...appConnectionWithoutSensitiveData } = appConnection
    return appConnectionWithoutSensitiveData as AppConnectionWithoutSensitiveData
}

const UpsertAppConnectionRequest = {
    schema: {
        body: UpsertAppConnectionRequestBody,
    },
}

const GetAppConnectionRequest = {
    schema: {
        params: Type.Object({
            connectionName: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: AppConnectionWithoutSensitiveData,
        },
    },
}

const ListAppConnectionsRequest = {
    schema: {
        querystring: ListAppConnectionsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionWithoutSensitiveData),
        },
    },
}

const DeleteAppConnectionRequest = {
    schema: {
        params: Type.Object({
            connectionId: ApId,
        }),
    },
}
