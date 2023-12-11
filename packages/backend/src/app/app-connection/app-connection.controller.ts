import {
    ApId,
    AppConnection,
    AppConnectionWithoutSensitiveData,
    ListAppConnectionsRequestQuery,
    SeekPage,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', UpsertAppConnectionRequest, async (request, reply) => {
        const appConnection = await appConnectionService.upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })

        await reply.status(StatusCodes.CREATED).send(removeSensitiveData(appConnection))
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

    app.delete('/:connectionId', DeleteAppConnectionRequest, async (request, reply): Promise<void> => {
        await appConnectionService.delete({
            id: request.params.connectionId,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
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
        description: 'Upsert an app connection based on the app name',
        body: UpsertAppConnectionRequestBody,
        Response: {
            [StatusCodes.CREATED]: AppConnectionWithoutSensitiveData,
        },
    },
}

const ListAppConnectionsRequest = {
    schema: {
        querystring: ListAppConnectionsRequestQuery,
        description: 'List app connections',
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionWithoutSensitiveData),
        },
    },
}

const DeleteAppConnectionRequest = {
    schema: {
        description: 'Delete an app connection',
        params: Type.Object({
            connectionId: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}
