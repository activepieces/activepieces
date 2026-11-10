import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil } from '@activepieces/core-utils'
import { AppConnection, EnginePrincipal, GetAppConnectionForWorkerRequestQuery } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { credentialProxyGrantService } from '../credential-proxy/credential-proxy-grant.service'
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

        const resolvedConnection = {
            ...appConnection,
            value: await secretManagersService(request.log).resolveObject({ value: appConnection.value, projectIds: [enginePrincipal.projectId], platformId: enginePrincipal.platform.id, throwOnFailure: false }),
        }
        const grants = credentialProxyGrantService(request.log)
        if (!grants.isEnabled()) {
            return resolvedConnection
        }
        return {
            ...resolvedConnection,
            value: await grants.issueForConnection({
                connection: resolvedConnection,
                projectId: enginePrincipal.projectId,
                jobId: enginePrincipal.id,
            }),
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
