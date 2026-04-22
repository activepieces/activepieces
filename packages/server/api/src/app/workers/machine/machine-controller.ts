import { PrincipalType, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerToApiContract } from '@activepieces/shared'
import { createRpcServer } from '@activepieces/shared/server'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { websocketService } from '../../core/websockets.service'
import { jobQueue } from '../job-queue/job-queue'
import { createHandlers } from '../rpc/worker-rpc-service'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncZod = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.FETCH_WORKER_SETTINGS, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal, _projectId, callback?: (data: unknown) => void) => {
            const rawPlatformId = socket.handshake.auth?.platformIdForDedicatedWorker
            const platformIdForDedicatedWorker = typeof rawPlatformId === 'string' ? rawPlatformId : undefined
            const isCanaryWorker = socket.handshake.auth?.isCanaryWorker === true
            const response = await machineService(app.log).onConnection(request, platformIdForDedicatedWorker)
            callback?.(response)
            createRpcServer<WorkerToApiContract>(socket, createHandlers(app.log, platformIdForDedicatedWorker, isCanaryWorker))
        }
    })

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.DISCONNECT, (socket) => {
        return async (_request: unknown, _principal) => {
            await machineService(app.log).onDisconnect({
                workerId: socket.handshake.auth.workerId,
            })
        }
    })

    app.get('/', ListWorkersParams, async (request) => {
        return machineService(app.log).list(request.principal.platform.id)
    })

    app.get('/queue-metrics', QueueMetricsParams, async () => {
        const allQueues = jobQueue(app.log).getAllQueues()
        const counts = await Promise.all(
            allQueues.map(async (queue) => {
                const jobCounts = await queue.getJobCounts('waiting', 'active', 'prioritized')
                return { name: queue.name, waiting: jobCounts.waiting + jobCounts.prioritized, active: jobCounts.active }
            }),
        )
        return { queues: counts }
    })
}


const ListWorkersParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const QueueMetricsParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        response: {
            200: z.object({
                queues: z.array(z.object({
                    name: z.string(),
                    waiting: z.number(),
                    active: z.number(),
                })),
            }),
        },
    },
}
