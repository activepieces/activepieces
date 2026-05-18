import { ApId,
    AppConnectionOwners,
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionWithoutSensitiveData,
    ApplicationEventName,
    GetOAuth2AuthorizationUrlRequestBody,
    GetOAuth2AuthorizationUrlResponse,
    ListAppConnectionOwnersRequestQuery,
    ListAppConnectionsRequestQuery,
    Permission,
    PLACEHOLDER_CONNECTION_TYPE,
    PrincipalType,
    ReplaceAppConnectionsRequestBody,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateConnectionValueRequestBody,
    UpsertAppConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { applicationEvents } from '../helper/application-events'
import { securityHelper } from '../helper/security-helper'
import { appConnectionService } from './app-connection-service/app-connection-service'
import { oauth2Util } from './app-connection-service/oauth2/oauth2-util'
import { AppConnectionEntity } from './app-connection.entity'

export const appConnectionController: FastifyPluginCallbackZod = (app, _opts, done) => {
    app.post('/', UpsertAppConnectionRequest, async (request, reply) => {
        const ownerId = await securityHelper.getUserIdFromRequest(request)
        const baseUpsert = {
            platformId: request.principal.platform.id,
            projectIds: [request.projectId],
            externalId: request.body.externalId,
            displayName: request.body.displayName,
            pieceName: request.body.pieceName,
            ownerId,
            scope: AppConnectionScope.PROJECT,
            metadata: request.body.metadata,
            pieceVersion: request.body.pieceVersion,
        }
        const appConnection = request.body.type === PLACEHOLDER_CONNECTION_TYPE
            ? await appConnectionService(request.log).upsert({
                ...baseUpsert,
                type: AppConnectionType.NO_AUTH,
                value: { type: AppConnectionType.NO_AUTH },
                status: AppConnectionStatus.MISSING,
            })
            : await appConnectionService(request.log).upsert({
                ...baseUpsert,
                type: request.body.type,
                value: request.body.value,
            })
        applicationEvents(request.log).sendUserEvent(request, {
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
        const appConnection = await appConnectionService(request.log).update({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectIds: [request.projectId],
            scope: AppConnectionScope.PROJECT,
            request: {
                displayName: request.body.displayName,
                projectIds: null,
                metadata: request.body.metadata,
            },
        })
        return appConnection
    })

    app.get('/', ListAppConnectionsRequest, async (request): Promise<SeekPage<AppConnectionWithoutSensitiveData>> => {
        const { displayName, pieceName, status, cursor, limit, scope } = request.query

        const appConnections = await appConnectionService(request.log).list({
            pieceName,
            displayName,
            status,
            scope,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
            externalIds: undefined,
        })

        const appConnectionsWithoutSensitiveData: SeekPage<AppConnectionWithoutSensitiveData> = {
            ...appConnections,
            data: appConnections.data.map(appConnectionService(request.log).removeSensitiveData),
        }
        return appConnectionsWithoutSensitiveData
    },
    )
    app.get('/owners', ListAppConnectionOwnersRequest, async (request): Promise<SeekPage<AppConnectionOwners>> => {
        const owners = await appConnectionService(request.log).getOwners({
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
        return {
            data: owners,
            next: null,
            previous: null,
        }
    },
    )

    app.post('/replace', ReplaceAppConnectionsRequest, async (request, reply) => {
        const { sourceAppConnectionId, targetAppConnectionId } = request.body
        await appConnectionService(request.log).replace({
            sourceAppConnectionId,
            targetAppConnectionId,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.delete('/:id', DeleteAppConnectionRequest, async (request, reply): Promise<void> => {
        const connection = await appConnectionService(request.log).getOneOrThrowWithoutValue({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
        })
        applicationEvents(request.log).sendUserEvent(request, {
            action: ApplicationEventName.CONNECTION_DELETED,
            data: {
                connection,
            },
        })
        await appConnectionService(request.log).delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
            scope: AppConnectionScope.PROJECT,
            projectId: request.projectId,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
    app.post('/oauth2/authorization-url', GetOAuth2AuthorizationUrlRequest, async (request) => {
        return oauth2Util(request.log).buildAuthorizationUrl({
            platformId: request.principal.platform.id,
            pieceName: request.body.pieceName,
            pieceVersion: request.body.pieceVersion,
            clientId: request.body.clientId,
            redirectUrl: request.body.redirectUrl,
            props: request.body.props,
            projectId: request.projectId,
        })
    })
    done()
}

const DEFAULT_PAGE_SIZE = 10


const UpsertAppConnectionRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_APP_CONNECTION,
            {
                type: ProjectResourceType.BODY,
            },
        ),
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
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_APP_CONNECTION,
            {
                type: ProjectResourceType.TABLE,
                tableName: AppConnectionEntity,
            },
        ),
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update an app connection value',
        body: UpdateConnectionValueRequestBody,
        params: z.object({
            id: ApId,
        }),
    },
}

const ReplaceAppConnectionsRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_APP_CONNECTION,
            {
                type: ProjectResourceType.BODY,
            },
        ),
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Replace app connections',
        body: ReplaceAppConnectionsRequestBody,
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}

const ListAppConnectionsRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_APP_CONNECTION,
            {
                type: ProjectResourceType.QUERY,
            },
        ),
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
const ListAppConnectionOwnersRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.READ_APP_CONNECTION,
            {
                type: ProjectResourceType.QUERY,
            },
        ),
    },
    schema: {
        querystring: ListAppConnectionOwnersRequestQuery,
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List app connection owners',
        response: {
            [StatusCodes.OK]: SeekPage(AppConnectionOwners),
        },
    },
}

const DeleteAppConnectionRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_APP_CONNECTION,
            {
                type: ProjectResourceType.TABLE,
                tableName: AppConnectionEntity,
            },
        ),
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete an app connection',
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}

const GetOAuth2AuthorizationUrlRequest = {
    config: {
        security: securityAccess.publicPlatform(
            [PrincipalType.USER],
        ),
    },
    schema: {
        tags: ['app-connections'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get OAuth2 authorization URL',
        body: GetOAuth2AuthorizationUrlRequestBody,
        response: {
            [StatusCodes.OK]: GetOAuth2AuthorizationUrlResponse,
        },
    },
}
