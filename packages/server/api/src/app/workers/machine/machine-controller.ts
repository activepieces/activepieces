import { createRpcServer, PrincipalType, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerToApiContract } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { websocketService } from '../../core/websockets.service'
import { parseWorkerGroupValue } from '../job'
import { jobBroker } from '../job-queue/job-broker'
import { jobQueue } from '../job-queue/job-queue'
import { createHandlers } from '../rpc/worker-rpc-service'
import { machineService } from './machine-service'

export const workerMachineController: FastifyPluginAsyncZod = async (app) => {

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.FETCH_WORKER_SETTINGS, (socket) => {
        return async (request: WorkerMachineHealthcheckRequest, _principal, _projectId, callback?: (data: unknown) => void) => {
            const rawWorkerGroupValue = socket.handshake.auth?.workerGroupId
            const assignment = parseWorkerGroupValue(typeof rawWorkerGroupValue === 'string' ? rawWorkerGroupValue : undefined)
            const response = await machineService(app.log).onConnection(request, assignment)
            callback?.(response)
            createRpcServer<WorkerToApiContract>(socket, createHandlers(app.log, assignment, socket.id))
        }
    })

    websocketService.addListener(PrincipalType.WORKER, WebsocketServerEvent.DISCONNECT, (socket) => {
        return async (_request: unknown, _principal) => {
            // Return jobs dispatched to THIS connection that it never reported done — they sit
            // orphaned in BullMQ `active` otherwise (graceful drain can't reach a job the worker never
            // received), which inflated active past concurrency during deploys. Scoped to socket.id,
            // not the stable workerId: a late disconnect for an old socket must not reclaim the jobs a
            // reconnected socket (same workerId) has already polled.
            await jobBroker(app.log).releaseConnectionJobs(socket.id)
            await machineService(app.log).onDisconnect({ workerId: socket.handshake.auth.workerId })
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
        tags: ['worker-machines'],
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
