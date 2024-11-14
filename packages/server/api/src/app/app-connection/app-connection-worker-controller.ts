import {
    ActivepiecesError,
    AppConnection,
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
        const appConnection = await appConnectionService.getOne({
            projectId: request.principal.projectId,
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

        return appConnection
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
