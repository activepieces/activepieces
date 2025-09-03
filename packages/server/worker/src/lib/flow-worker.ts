import { inspect } from 'util'
import { AgentJobData, OneTimeJobData, OutgoingWebhookJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, ConsumeJobResponseStatus, WebsocketClientEvent, WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerCache } from './cache/worker-cache'
import { agentJobExecutor } from './executors/agent-job-executor'
import { flowJobExecutor } from './executors/flow-job-executor'
import { outgoingWebhookExecutor } from './executors/outgoing-webhook-job-executor'
import { repeatingJobExecutor } from './executors/repeating-job-executor'
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
                queueName: request.queueName,
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


        heartbeatInterval = setInterval(() => {
            void (async (): Promise<void> => {
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
            })()
        }, 15000)

    },

    async close(): Promise<void> {
        await engineRunnerSocket(log).disconnect()

        if (socket) {
            socket.disconnect()
        }

        clearInterval(heartbeatInterval)
        if (workerMachine.hasSettings()) {
            await engineRunner(log).shutdownAllWorkers()
        }
    },
})


async function consumeJob(request: ConsumeJobRequest, log: FastifyBaseLogger): Promise<ConsumeJobResponse> {
    const { jobId, queueName, jobData, attempsStarted, engineToken } = request
    switch (queueName) {
        case QueueName.USERS_INTERACTION:
            await userInteractionJobExecutor(log).execute(jobData as unknown as UserInteractionJobData, engineToken, workerToken)
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        case QueueName.ONE_TIME:
            await flowJobExecutor(log).executeFlow(jobData as unknown as OneTimeJobData, attempsStarted, engineToken)
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        case QueueName.SCHEDULED:
            return repeatingJobExecutor(log).executeRepeatingJob({
                jobId,
                data: jobData as unknown as RepeatingJobData,
                engineToken,
                workerToken,
            })

        case QueueName.WEBHOOK: {
            return webhookExecutor(log).consumeWebhook(jobId, jobData as unknown as WebhookJobData, engineToken, workerToken)
        }
        case QueueName.AGENTS: {
            await agentJobExecutor(log).executeAgent({
                jobData: jobData as unknown as AgentJobData,
                engineToken,
                workerToken,
            })
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }
        case QueueName.OUTGOING_WEBHOOK: {
            await outgoingWebhookExecutor(log).consumeOutgoingWebhook(jobId, jobData as unknown as OutgoingWebhookJobData)
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }
        default: {
            throw new Error(`Unknown queue name: ${queueName}`)
        }
    }
}
