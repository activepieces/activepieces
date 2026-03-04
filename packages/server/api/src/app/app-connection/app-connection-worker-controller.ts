import { securityAccess } from '@activepieces/server-common'
import {
    ActivepiecesError,
    AppConnection,
    AppConnectionScope,
    assertNotNullOrUndefined,
    EnginePrincipal,
    ErrorCode,
    GetAppConnectionForWorkerRequestQuery,
    isNil,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { secretManagersService } from '../ee/secret-managers/secret-managers.service'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginAsyncTypebox = async (app) => {

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

        return {
            ...appConnection,
            value: appConnection.scope === AppConnectionScope.PROJECT ? appConnection.value : await secretManagersService(request.log).resolveObject({ value: appConnection.value, platformId: enginePrincipal.platform.id, throwOnFailure: false }),
        }
    },
    )

}

const GetAppConnectionRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: GetAppConnectionForWorkerRequestQuery,
    },
}
