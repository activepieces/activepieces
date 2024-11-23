import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { machineService } from './machine-service'
import { PrincipalType, WorkerMachineHealthcheckRequest, WorkerPrincipal } from '@activepieces/shared'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListWorkersParams, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        return machineService.list()
    })


    app.post('/heartbeat', HeartbeatParams, async (request) => {
        const { cpuUsagePercentage, ramUsagePercentage, totalAvailableRamInBytes, diskInfo, ip } = request.body
        const workerPrincipal = request.principal as unknown as WorkerPrincipal
        await machineService.upsert({
            cpuUsagePercentage,
            diskInfo,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            ip,
            workerPrincipal,
        })
    })
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
