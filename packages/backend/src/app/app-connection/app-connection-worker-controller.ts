import { ActivepiecesError, AppConnection, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { allowWorkersOnly } from '../authentication/authorization'
import { appConnectionService } from './app-connection-service/app-connection-service'

export const appConnectionWorkerController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.addHook('preHandler', allowWorkersOnly)

    app.get('/:connectionName', GetAppConnectionRequest, async (request): Promise<AppConnection> => {
        const appConnection = await appConnectionService.getOne({
            projectId: request.principal.projectId,
            name: request.params.connectionName,
        })

        if (isNil(appConnection)) {
            throw new ActivepiecesError({
                code: ErrorCode.APP_CONNECTION_NOT_FOUND,
                params: {
                    id: request.params.connectionName,
                },
            })
        }

        return appConnection
    })

    done()
}

const GetAppConnectionRequest = {
    schema: {
        params: Type.Object({
            connectionName: Type.String(),
        }),
    },
}
