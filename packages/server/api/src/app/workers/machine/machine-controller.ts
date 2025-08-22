import { Principal, PrincipalType, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { machineService } from './machine-service'
import { websocketService } from '../../websockets/websockets.service'
import { WebsocketServerEvent } from '../../../../../../shared/src/lib/websocket'

export const workerMachineController: FastifyPluginAsyncTypebox = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.MACHINE_HEARTBEAT, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal: Principal, callback?: (data: WorkerMachineHealthcheckResponse) => void) => {
            const response = await machineService(app.log).onHeartbeat({
                ...request,
                socket,
            })
            callback?.(response)
        }
    })

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.DISCONNECT, (socket) => {
        return async (_request: unknown) => {
            await machineService(app.log).onDisconnect({
                workerId: socket.handshake.auth.workerId,
                socket,
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
