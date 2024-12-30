import {
    ActivepiecesError,
    AppConnection,
    AppConnectionScope,
    assertNotNullOrUndefined,
    EnginePrincipal,
    ErrorCode,
    GetAppConnectionForWorkerRequestQuery,
    isNil,
    PrincipalType,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/:externalId', GetAppConnectionRequest, async (request): Promise<AppConnection> => {
        const enginePrincipal = (request.principal as EnginePrincipal)
        assertNotNullOrUndefined(enginePrincipal.projectId, 'projectId')
        const appConnection = await appConnectionService(request.log).getOne({
            projectId: enginePrincipal.projectId,
            platformId: enginePrincipal.platform.id,
            externalId: request.params.externalId,
            scope: AppConnectionScope.PROJECT,
        })
        const globalAppConnection = await appConnectionService(request.log).getOne({
            externalId: request.params.externalId,
            scope: AppConnectionScope.PLATFORM,
            platformId: enginePrincipal.platform.id,
        })

        if (!isNil(appConnection)) {
            return appConnection
        }
        if (!isNil(globalAppConnection)) {
            return globalAppConnection
        }
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: `externalId=${request.params.externalId}`,
                entityType: 'AppConnection',
            },
        })
    },
    )

}

const GetAppConnectionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        params: GetAppConnectionForWorkerRequestQuery,
    },
}
