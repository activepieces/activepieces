import {
    apId,
    ApId,
    AppConnectionScope,
    AppConnectionWithoutSensitiveData,
    EndpointScope,
    ListGlobalConnectionsRequestQuery,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateGlobalConnectionValueRequestBody,
    UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { securityHelper } from '../../helper/security-helper'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'

export const globalConnectionModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.globalConnectionsEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(globalConnectionController, { prefix: '/v1/global-connections' })
}

const globalConnectionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', UpsertGlobalConnectionRequest, async (request, reply) => {
        const appConnection = await appConnectionService(request.log).upsert({
            platformId: request.principal.platform.id,
            type: request.body.type,
            projectIds: request.body.projectIds,
            externalId: request.body.externalId ?? apId(),
            value: request.body.value,
            displayName: request.body.displayName,
            pieceName: request.body.pieceName,
            ownerId: await securityHelper.getUserIdFromRequest(request),
            scope: AppConnectionScope.PLATFORM,
        })
        await reply
            .status(StatusCodes.CREATED)
            .send(appConnection)
    })

    app.post('/:id', UpdateGlobalConnectionRequest, async (request) => {
        return appConnectionService(request.log).update({
            id: request.params.id,
            platformId: request.principal.platform.id,
            scope: AppConnectionScope.PLATFORM,
            projectIds: null,
            request: {
                displayName: request.body.displayName,
                projectIds: request.body.projectIds ?? null,
            },
        })
    })

    app.get('/', ListGlobalConnectionsRequest, async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
        const { displayName, pieceName, status, cursor, limit } = request.query

        const appConnections = await appConnectionService(request.log).list({
            pieceName,
            displayName,
            status,
            platformId: request.principal.platform.id,
            projectId: null,
            scope: AppConnectionScope.PLATFORM,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
            externalIds: undefined,
        })

        return {
            ...appConnections,
            data: appConnections.data.map(appConnectionService(request.log).removeSensitiveData),
        }
    },
    )

    app.delete('/:id', DeleteGlobalConnectionRequest, async (request, reply): Promise<void> => {
        const connection = await appConnectionService(request.log).getOneOrThrowWithoutValue({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectId: null,
        })
        await appConnectionService(request.log).delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
            scope: AppConnectionScope.PLATFORM,
            projectId: null,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const DEFAULT_PAGE_SIZE = 10

const UpsertGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['global-connections'],
        body: UpsertGlobalConnectionRequestBody,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.CREATED]: AppConnectionWithoutSensitiveData,
        },
    },
}

const UpdateGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['global-connections'],
        body: UpdateGlobalConnectionValueRequestBody,
        params: Type.Object({
            id: ApId,
        }),
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const ListGlobalConnectionsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['global-connections'],
        querystring: ListGlobalConnectionsRequestQuery,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionWithoutSensitiveData),
        },
    },
}

const DeleteGlobalConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['global-connections'],
        params: Type.Object({
            id: ApId,
        }),
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}
