import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType, WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../../core/websockets.service'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.FETCH_WORKER_SETTINGS, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal, _projectId, callback?: (data: unknown) => void) => {
            const response = await machineService(app.log).onConnection(request, socket.handshake.auth?.platformIdForDedicatedWorker)
            callback?.(response)
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
