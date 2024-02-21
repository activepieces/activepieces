import {
    ActivepiecesError,
    AppConnection,
    ErrorCode,
    isNil,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { allowWorkersOnly } from '../authentication/authorization'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.addHook('preHandler', allowWorkersOnly)

    app.get(
        '/:connectionName',
        GetAppConnectionRequest,
        async (request): Promise<AppConnection> => {
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

    done()
}

const GetAppConnectionRequest = {
    schema: {
        params: Type.Object({
            connectionName: Type.String(),
        }),
    },
}
