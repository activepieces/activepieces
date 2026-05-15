import {
    ActivepiecesError,
    AppConnection,
    AppConnectionType,
    assertNotNullOrUndefined,
    EnginePrincipal,
    ErrorCode,
    GetAppConnectionForWorkerRequestQuery,
    isNil,
    isPieceConnection,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { secretManagersService } from '../ee/secret-managers/secret-managers.service'
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

        const resolvedValue = await secretManagersService(request.log).resolveObject({ value: appConnection.value, projectIds: [enginePrincipal.projectId], platformId: enginePrincipal.platform.id, throwOnFailure: false })
        if (isPieceConnection(appConnection)) {
            return {
                ...appConnection,
                value: resolvedValue,
            }
        }
        if (resolvedValue.type !== AppConnectionType.SECRET_TEXT) {
            throw new Error(`Credential ${appConnection.id} resolved to unexpected value type ${resolvedValue.type}`)
        }
        return {
            ...appConnection,
            value: resolvedValue,
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
