import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    apId,
    ApId,
    AppConnection,
    AppConnectionScope,
    AppConnectionWithoutSensitiveData,
    ListAppConnectionsRequestQuery,
    PrincipalType,
    SeekPage,
    UpdateConnectionValueRequestBody,
    UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { eventsHooks } from '../../helper/application-events'
import { securityHelper } from '../../helper/security-helper'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'

export const globalConnectionModule: FastifyPluginAsyncTypebox = async (app) => {
    // TODO add feature gaurd
   // app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.customDomainsEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(globalConnectionController, { prefix: '/v1/global-connections' })
}


const globalConnectionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', UpsertGlobalConnectionRequest, async (request, reply) => {
        const appConnection = await appConnectionService.upsert({
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            type: request.body.type,
            externalId: apId(),
            value: request.body.value,
            displayName: request.body.displayName,
            pieceName: request.body.pieceName,
            ownerId: await securityHelper.getUserIdFromRequest(request),
            scope: AppConnectionScope.PLATFORM,
        })
        eventsHooks.get().sendUserEventFromRequest(request, {
            action: ApplicationEventName.CONNECTION_UPSERTED,
            data: {
                connection: appConnection,
            },
        })
        await reply
            .status(StatusCodes.CREATED)
            .send(removeSensitiveData(appConnection))
    })

    app.post('/:id', UpdateGlobalConnectionRequest, async (request) => {
        const appConnection = await appConnectionService.update({
            id: request.params.id,
            projectId: request.principal.projectId,
            scope: AppConnectionScope.PLATFORM,
            request: request.body,
        })
        return removeSensitiveData(appConnection)
    })

    app.get(
        '/',
        ListGlobalConnectionsRequest,
        async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
            const { displayName, pieceName, status, cursor, limit } = request.query

            const appConnections = await appConnectionService.list({
                pieceName,
                displayName,
                status,
                projectId: request.principal.projectId,
                scope: AppConnectionScope.PLATFORM,
                cursorRequest: cursor ?? null,
                limit: limit ?? DEFAULT_PAGE_SIZE,
            })

            return {
                ...appConnections,
                data: appConnections.data.map(removeSensitiveData),
            }
        },
    )

    app.delete(
        '/:id',
        DeleteGlobalConnectionRequest,
        async (request, reply): Promise<void> => {
            const connection = await appConnectionService.getOneOrThrow({
                id: request.params.id,
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
                scope: AppConnectionScope.PLATFORM,
                projectId: null,
            })
            await reply.status(StatusCodes.NO_CONTENT).send()
        },
    )
}

const DEFAULT_PAGE_SIZE = 10

const removeSensitiveData = (
    appConnection: AppConnection,
): AppConnectionWithoutSensitiveData => {
    const { value: _, ...appConnectionWithoutSensitiveData } = appConnection
    return appConnectionWithoutSensitiveData as AppConnectionWithoutSensitiveData
}

const UpsertGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: UpsertGlobalConnectionRequestBody,
        response: {
            [StatusCodes.CREATED]: AppConnectionWithoutSensitiveData,
        },
    },
}

const UpdateGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: UpdateConnectionValueRequestBody,
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListGlobalConnectionsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        querystring: ListAppConnectionsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionWithoutSensitiveData),
        },
    },
}

const DeleteGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}
