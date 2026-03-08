import { createRpcServer, PrincipalType, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerToApiContract } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { websocketService } from '../../core/websockets.service'
import { createHandlers } from '../rpc/worker-rpc-service'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncZod = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.FETCH_WORKER_SETTINGS, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal, _projectId, callback?: (data: unknown) => void) => {
            const rawPlatformId = socket.handshake.auth?.platformIdForDedicatedWorker
            const platformIdForDedicatedWorker = typeof rawPlatformId === 'string' ? rawPlatformId : undefined
            const response = await machineService(app.log).onConnection(request, platformIdForDedicatedWorker)
            callback?.(response)
            createRpcServer<WorkerToApiContract>(socket, createHandlers(app.log, platformIdForDedicatedWorker))
        }
    })

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.DISCONNECT, (socket) => {
        return async (_request: unknown, _principal) => {
            await machineService(app.log).onDisconnect({
                workerId: socket.handshake.auth.workerId,
            })
        }
    })

    app.get('/', ListWorkersParams, async () => {
        return machineService(app.log).list()
    })
}


const ListWorkersParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
