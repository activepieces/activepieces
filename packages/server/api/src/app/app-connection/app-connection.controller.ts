import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { eventsHooks } from '../helper/application-events'
import { appConnectionService } from './app-connection-service/app-connection-service'
import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    ApId,
    AppConnection,
    AppConnectionWithoutSensitiveData,
    ListAppConnectionsRequestQuery,
    Permission,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpsertAppConnectionRequestBody,
    ValidateConnectionNameRequestBody,
    ValidateConnectionNameResponse,
} from '@activepieces/shared'

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
            const { name, pieceName, cursor, limit } = request.query

            const appConnections = await appConnectionService.list({
                pieceName,
                name,
                projectId: request.principal.projectId,
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
    app.post(
        '/validate-connection-name',
        ValidateConnectionNameRequest,
        async (request, reply): Promise<ValidateConnectionNameResponse> => {
            const result = await appConnectionService.validateConnectionName({
                projectId: request.principal.projectId,
                connectionName: request.body.connectionName,
            })
            if (result.error) {
                return reply.status(StatusCodes.BAD_REQUEST).send(result)
            }
            return result
        },
    ),
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

const ValidateConnectionNameRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_APP_CONNECTION,
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: ValidateConnectionNameRequestBody,
        description: 'Validate app connection name',
        response: {
            [StatusCodes.OK]: ValidateConnectionNameResponse,
            [StatusCodes.BAD_REQUEST]: ValidateConnectionNameResponse,
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
