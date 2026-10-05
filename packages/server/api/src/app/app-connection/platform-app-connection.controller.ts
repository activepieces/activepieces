import { ApId, SeekPage } from '@activepieces/core-utils'
import { AppConnectionWithoutSensitiveData, ListPlatformAppConnectionsRequestQuery, PlatformAppConnectionOwnersResponse, PlatformAppConnectionsListItem, PlatformAppConnectionsSummary, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const platformAppConnectionController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListPlatformAppConnectionsRequest, async (request): Promise<SeekPage<PlatformAppConnectionsListItem>> => {
        const { displayName, pieceName, status, scope, cursor, limit, projectIds, ownerIds } = request.query
        return appConnectionService(request.log).listForPlatform({
            platformId: request.principal.platform.id,
            pieceNames: pieceName,
            displayName,
            status,
            scope,
            projectIds,
            ownerIds,
            cursorRequest: cursor ?? null,
            limit: limit ?? DEFAULT_PAGE_SIZE,
        })
    })

    app.get('/owners', ListPlatformAppConnectionOwnersRequest, async (request): Promise<PlatformAppConnectionOwnersResponse> => {
        return appConnectionService(request.log).listOwnersForPlatform({
            platformId: request.principal.platform.id,
        })
    })

    app.get('/summary', PlatformAppConnectionsSummaryRequest, async (request): Promise<PlatformAppConnectionsSummary> => {
        return appConnectionService(request.log).summaryForPlatform({
            platformId: request.principal.platform.id,
        })
    })

    app.post('/:id/revalidate', RevalidatePlatformAppConnectionRequest, async (request): Promise<AppConnectionWithoutSensitiveData> => {
        return appConnectionService(request.log).revalidate({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectId: null,
        })
    })
}

const DEFAULT_PAGE_SIZE = 10

const ListPlatformAppConnectionsRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        querystring: ListPlatformAppConnectionsRequestQuery,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: SeekPage(PlatformAppConnectionsListItem),
        },
    },
}

const ListPlatformAppConnectionOwnersRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: PlatformAppConnectionOwnersResponse,
        },
    },
}

const PlatformAppConnectionsSummaryRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: PlatformAppConnectionsSummary,
        },
    },
}

const RevalidatePlatformAppConnectionRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: AppConnectionWithoutSensitiveData,
        },
    },
}
