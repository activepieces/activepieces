import { Principal, PrincipalType, WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../../core/websockets.service'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.FETCH_WORKER_SETTINGS, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal: Principal, callback?: (data: unknown) => void) => {
            const response = await machineService(app.log).onConnection(request, socket.handshake.auth?.platformIdForDedicatedWorker)
            callback?.(response)
        }
    })

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.DISCONNECT, (socket) => {
        return async (_request: unknown) => {
            await machineService(app.log).onDisconnect({
                workerId: socket.handshake.auth.workerId,
            })
        }
    })
    
    app.get('/', ListWorkersParams, async (req, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, reply)
        return machineService(app.log).list()
    })
}


const ListWorkersParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
