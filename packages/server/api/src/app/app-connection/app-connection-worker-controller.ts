import {
    FastifyPluginCallbackTypebox,
} from '@fastify/type-provider-typebox'
import { allowWorkersOnly } from '../authentication/authorization'
import { appConnectionService } from './app-connection-service/app-connection-service'
import {
    AppConnection,
    GetAppConnectionRequestParams,
    PrincipalType,
} from '@activepieces/shared'

export const appConnectionWorkerController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.addHook('preHandler', allowWorkersOnly)

    app.get('/:connectionName', GetConnectionParams, async (request): Promise<AppConnection> => {
        return appConnectionService.getOneOrThrowByName({
            projectId: request.principal.projectId,
            name: request.params.connectionName,
        })
    })

    done()
}

const GetConnectionParams = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {
        params: GetAppConnectionRequestParams,
    },
}


