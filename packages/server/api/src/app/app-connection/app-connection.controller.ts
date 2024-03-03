import {
    ApId,
    AppConnection,
    AppConnectionWithoutSensitiveData,
    ListAppConnectionsRequestQuery,
    Permission,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    SeekPage,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { appConnectionService } from './app-connection-service/app-connection-service'
import { eventsHooks } from '../helper/application-events'
import { ApplicationEventName } from '@activepieces/ee-shared'

export const appConnectionController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.post('/', UpsertAppConnectionRequest, async (request, reply) => {
        const appConnection = await appConnectionService.upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })
        eventsHooks.get().send(request, {
            action: ApplicationEventName.UPSERTED_CONNECTION,
            connection: appConnection,
            userId: request.principal.id,
        })
        await reply
            .status(StatusCodes.CREATED)
            .send(removeSensitiveData(appConnection))
    })

    app.get(
        '/',
        ListAppConnectionsRequest,
        async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
            const { pieceName, cursor, limit } = request.query

            const appConnections = await appConnectionService.list({
                projectId: request.principal.projectId,
                pieceName,
                cursorRequest: cursor ?? null,
                limit: limit ?? DEFAULT_PAGE_SIZE,
            })

            const appConnectionsWithoutSensitiveData: SeekPage<AppConnectionWithoutSensitiveData> =
        {
            ...appConnections,
            data: appConnections.data.map(removeSensitiveData),
        }

            return appConnectionsWithoutSensitiveData
        },
    )

    app.delete(
        '/:id',
        DeleteAppConnectionRequest,
        async (request, reply): Promise<void> => {
            const connection = await appConnectionService.getOneOrThrow({
                id: request.params.id,
                projectId: request.principal.projectId,
            })
            eventsHooks.get().send(request, {
                action: ApplicationEventName.DELETED_CONNECTION,
                connection,
                userId: request.principal.id,
            })
            await appConnectionService.delete({
                id: request.params.id,
                projectId: request.principal.projectId,
            })
            await reply.status(StatusCodes.NO_CONTENT).send()
        },
    )

    done()
}

const DEFAULT_PAGE_SIZE = 10

const removeSensitiveData = (
    appConnection: AppConnection,
): AppConnectionWithoutSensitiveData => {
    const { value: _, ...appConnectionWithoutSensitiveData } = appConnection
    return appConnectionWithoutSensitiveData as AppConnectionWithoutSensitiveData
}

const UpsertAppConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_APP_CONNECTION,
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Upsert an app connection based on the app name',
        body: UpsertAppConnectionRequestBody,
        Response: {
            [StatusCodes.CREATED]: AppConnectionWithoutSensitiveData,
        },
    },
}

const ListAppConnectionsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_APP_CONNECTION,
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListAppConnectionsRequestQuery,
        description: 'List app connections',
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionWithoutSensitiveData),
        },
    },
}

const DeleteAppConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_APP_CONNECTION,
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete an app connection',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}
