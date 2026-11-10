import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { EnginePrincipal, GetVariableForWorkerRequestParams, RevealVariableResponse } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { credentialProxyGrantService } from '../credential-proxy/credential-proxy-grant.service'
import { variableService } from './variable.service'

export const variableWorkerController: FastifyPluginAsyncZod = async (app) => {
    app.get('/:name', GetVariableRequest, async (request): Promise<RevealVariableResponse> => {
        const enginePrincipal = (request.principal as EnginePrincipal)
        assertNotNullOrUndefined(enginePrincipal.projectId, 'projectId')
        const value = await variableService(request.log).getDecryptedValueForWorker({
            projectId: enginePrincipal.projectId,
            name: request.params.name,
        })
        const grants = credentialProxyGrantService(request.log)
        if (!grants.isEnabled()) {
            return { value }
        }
        return {
            value: await grants.issueForVariable({
                name: request.params.name,
                projectId: enginePrincipal.projectId,
                platformId: enginePrincipal.platform.id,
                jobId: enginePrincipal.id,
            }),
        }
    })
}

const GetVariableRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: GetVariableForWorkerRequestParams,
        response: {
            [StatusCodes.OK]: RevealVariableResponse,
        },
    },
}
