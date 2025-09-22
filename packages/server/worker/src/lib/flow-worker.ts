import { inspect } from 'util'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, WebsocketClientEvent, WebsocketServerEvent, WorkerJobType, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerCache } from './cache/worker-cache'
import { agentJobExecutor } from './executors/agent-job-executor'
import { executeTriggerExecutor } from './executors/execute-trigger-executor'
import { flowJobExecutor } from './executors/flow-job-executor'
import { renewWebhookExecutor } from './executors/renew-webhook-executor'
import { userInteractionJobExecutor } from './executors/user-interaction-job-executor'
import { webhookExecutor } from './executors/webhook-job-executor'
import { engineRunner } from './runner'
import { engineRunnerSocket } from './runner/engine-runner-socket'
import { workerMachine } from './utils/machine'

let workerToken: string
let heartbeatInterval: NodeJS.Timeout
let socket: Socket

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        rejectedPromiseHandler(workerCache(log).deleteStaleCache(), log)
        await engineRunnerSocket(log).init()

        workerToken = token

        const { url, path } = workerMachine.getSocketUrlAndPath()
        socket = io(url, {
            transports: ['websocket'],
            path,
            autoConnect: false,
            reconnection: true,
        })

        socket.auth = { token: workerToken, workerId: workerMachine.getWorkerId() }

        socket.on('connect', () => {
            log.info({
                message: 'Connected to server',
                workerId: workerMachine.getWorkerId(),
                socketId: socket.id,
            })
        })

        socket.on('disconnect', () => {
            log.info({
                message: 'Disconnected from server',
            })
        })

        socket.on('connect_error', (error) => {
            log.error({
                message: 'Socket connection error',
                error: error.message,
            })
        })

        socket.on('error', (error) => {
            log.error({
                message: 'Socket error',
                error: error.message,
            })
        })

        socket.on(WebsocketClientEvent.CONSUME_JOB_REQUEST, async (request: ConsumeJobRequest, callback: (data: unknown) => void) => {
            log.info({
                message: 'Received consume job request',
                jobId: request.jobId,
                attempsStarted: request.attempsStarted,
            })
            try {
                const response: ConsumeJobResponse = await consumeJob(request, log)
                callback(response)
            }
            catch (error) {
                log.info({
                    message: 'Failed to consume job',
                    error,
                })
                const response: ConsumeJobResponse = {
                    status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                    errorMessage: inspect(error),
                }
                callback(response)
            }
        })

        socket.connect()


        heartbeatInterval = setInterval(async () => {
            if (!socket.connected) {
                log.error({
                    message: 'Not connected to server, retrying...',
                })
                return
            }
            try {
                const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
                const response = await socket.timeout(10000).emitWithAck(WebsocketServerEvent.MACHINE_HEARTBEAT, request)
                await workerMachine.init(response, log)
            }
            catch (error) {
                log.error({
                    message: 'Failed to send heartbeat, retrying...',
                    error,
                })
            }
        }, 15000)

    },

    async close(): Promise<void> {
        await engineRunnerSocket(log).disconnect()

        if (socket) {
            socket.disconnect()
        }

        clearTimeout(heartbeatInterval)
        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
    },
})


async function consumeJob(request: ConsumeJobRequest, log: FastifyBaseLogger): Promise<ConsumeJobResponse> {
    const { jobId, jobData, attempsStarted, engineToken, timeoutInSeconds } = request
    switch (jobData.jobType) {
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_TOOL:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
            await userInteractionJobExecutor(log).execute(jobData, engineToken, workerToken, timeoutInSeconds)
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        case WorkerJobType.EXECUTE_FLOW:
            await flowJobExecutor(log).executeFlow({ jobData, attempsStarted, engineToken, timeoutInSeconds })
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        case WorkerJobType.EXECUTE_POLLING:
            return executeTriggerExecutor(log).executeTrigger({
                jobId,
                data: jobData,
                engineToken,
                workerToken,
                timeoutInSeconds,
            })
        case WorkerJobType.RENEW_WEBHOOK:
            return renewWebhookExecutor(log).renewWebhook({
                data: jobData,
                engineToken,
                timeoutInSeconds,
            })
        case WorkerJobType.EXECUTE_WEBHOOK: {
            return webhookExecutor(log).consumeWebhook(jobId, jobData, engineToken, workerToken, timeoutInSeconds)
        }
        case WorkerJobType.EXECUTE_AGENT: {
            await agentJobExecutor(log).executeAgent({
                jobData,
                engineToken,
                workerToken,
            })
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }
    }
}
