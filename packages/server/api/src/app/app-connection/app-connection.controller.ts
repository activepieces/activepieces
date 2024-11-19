import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    ApId,
    AppConnectionScope,
    AppConnectionWithoutSensitiveData,
    ListAppConnectionsRequestQuery,
    Permission,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateConnectionValueRequestBody,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { eventsHooks } from '../helper/application-events'
import { securityHelper } from '../helper/security-helper'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', UpsertAppConnectionRequest, async (request, reply) => {
        const appConnection = await appConnectionService.upsert({
            platformId: request.principal.platform.id,
            projectIds: [request.principal.projectId],
            type: request.body.type,
            externalId: request.body.externalId,
            value: request.body.value,
            displayName: request.body.displayName,
            pieceName: request.body.pieceName,
            ownerId: await securityHelper.getUserIdFromRequest(request),
            scope: AppConnectionScope.PROJECT,
        })
        eventsHooks.get().sendUserEventFromRequest(request, {
            action: ApplicationEventName.CONNECTION_UPSERTED,
            data: {
                connection: appConnection,
            },
        })
        await reply
            .status(StatusCodes.CREATED)
            .send(appConnection)
    })

    app.post('/:id', UpdateConnectionValueRequest, async (request) => {
        const appConnection = await appConnectionService.update({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectIds: [request.principal.projectId],
            scope: AppConnectionScope.PROJECT,
            request: {
                displayName: request.body.displayName,
                projectIds: null,
            },
        })
        return appConnection
    })

    app.get('/', ListAppConnectionsRequest, async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
        const { displayName, pieceName, status, cursor, limit, scope } = request.query

        const appConnections = await appConnectionService.list({
            pieceName,
            displayName,
            status,
            scope,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
        })

        const appConnectionsWithoutSensitiveData: SeekPage<AppConnectionWithoutSensitiveData> = {
            ...appConnections,
            data: appConnections.data.map(appConnectionService.removeSensitiveData),
        }
        return appConnectionsWithoutSensitiveData
    },
    )
    app.delete('/:id', DeleteAppConnectionRequest, async (request, reply): Promise<void> => {
        const connection = await appConnectionService.getOneOrThrowWithoutValue({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
        })
        eventsHooks.get().sendUserEventFromRequest(request, {
            action: ApplicationEventName.CONNECTION_DELETED,
            data: {
                connection,
            },
        })
        await appConnectionService.delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
            scope: AppConnectionScope.PROJECT,
            projectId: request.principal.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    done()
}

const DEFAULT_PAGE_SIZE = 10


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

const UpdateConnectionValueRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_APP_CONNECTION,
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update an app connection value',
        body: UpdateConnectionValueRequestBody,
        params: Type.Object({
            id: ApId,
        }),
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
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}
