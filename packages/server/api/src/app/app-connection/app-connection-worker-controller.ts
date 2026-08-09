import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil } from '@activepieces/core-utils'
import { AppConnection, EnginePrincipal, GetAppConnectionForWorkerQueryParams, GetAppConnectionForWorkerRequestQuery } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { secretManagersService } from '../ee/secret-managers/secret-managers.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/:externalId', GetAppConnectionRequest, async (request): Promise<AppConnection> => {
        const enginePrincipal = (request.principal as EnginePrincipal)
        assertNotNullOrUndefined(enginePrincipal.projectId, 'projectId')
        const appConnection = await appConnectionService(request.log).getOne({
            projectId: enginePrincipal.projectId,
            platformId: enginePrincipal.platform.id,
            externalId: request.params.externalId,
        })

        if (isNil(appConnection)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `externalId=${request.params.externalId}`,
                    entityType: 'AppConnection',
                },
            })
        }

        assertPieceBinding({
            requestedPieceName: request.query.pieceName,
            appConnection,
        })

        return {
            ...appConnection,
            value: await secretManagersService(request.log).resolveObject({ value: appConnection.value, projectIds: [enginePrincipal.projectId], platformId: enginePrincipal.platform.id, throwOnFailure: false }),
        }
    },
    )

}

const assertPieceBinding = ({ requestedPieceName, appConnection }: AssertPieceBindingParams): void => {
    const enforced = system.getBoolean(AppSystemProp.ENFORCE_CONNECTION_PIECE_BINDING) ?? false
    if (!enforced || isNil(requestedPieceName) || appConnection.pieceName === requestedPieceName) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.MCP_PIECE_CONNECTION_MISMATCH,
        params: {
            pieceName: requestedPieceName,
            connectionPieceName: appConnection.pieceName,
            connectionId: appConnection.id,
        },
    })
}

const GetAppConnectionRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: GetAppConnectionForWorkerRequestQuery,
        querystring: GetAppConnectionForWorkerQueryParams,
    },
}

type AssertPieceBindingParams = {
    requestedPieceName: string | undefined
    appConnection: AppConnection
}
