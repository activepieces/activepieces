import { system } from '@activepieces/server-shared'
import { ApEdition, PrincipalType, WorkerMachineHealthcheckRequest, WorkerMachineType, WorkerPrincipal } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { platformService } from '../../platform/platform.service'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListWorkersParams, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        // TODO replace with specific platform id in future
        if ([ApEdition.CLOUD].includes(system.getEdition())) {
            return []
        }
        return machineService.list()
    })

    app.post('/', GenerateWorkerTokenParams, async (request) => {
        const platform = await platformService.getOneOrThrow(request.body.platformId)
        return accessTokenManager.generateWorkerToken({
            platformId: platform.id,
            type: WorkerMachineType.DEDICATED,
        })
    })


    app.post('/heartbeat', HeartbeatParams, async (request) => {
        const { cpuUsage, ramUsage, totalRamInBytes } = request.body
        const workerPrincipal = request.principal as unknown as WorkerPrincipal
        await machineService.upsert({
            cpuUsage,
            ramUsage,
            totalRamInBytes,
            workerPrincipal,
        })
    })
}



const GenerateWorkerTokenParams = {
    config: {
        // TODO this should be replaced with the user
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
    schema: {
        body: Type.Object({
            platformId: Type.String(),
        }),
    },
}

const HeartbeatParams = {
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
    schema: {
        body: WorkerMachineHealthcheckRequest,
    },
}

const ListWorkersParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}