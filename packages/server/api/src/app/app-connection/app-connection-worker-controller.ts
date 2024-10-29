import {
    ActivepiecesError,
    AppConnection,
    ErrorCode,
    isNil,
    PrincipalType,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/:connectionName', GetAppConnectionRequest, async (request): Promise<AppConnection> => {
        const appConnection = await appConnectionService.getOne({
            projectId: request.principal.projectId,
            name: request.params.connectionName,
        })

        if (isNil(appConnection)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `connectionName=${request.params.connectionName}`,
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
        params: Type.Object({
            connectionName: Type.String(),
        }),
    },
}
