import { AgentJobData, JobData, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { apId, ConsumeJobRequest, isNil, WebsocketClientEvent, WebsocketServerEvent, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { agentJobExecutor } from './executors/agent-job-executor'
import { flowJobExecutor } from './executors/flow-job-executor'
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

        await engineRunnerSocket(log).init()

        workerToken = token

        socket = io(workerMachine.getInternalApiUrl(), {
            transports: ['websocket'],
            path: '/socket.io',
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
                workerId: workerMachine.getWorkerId()
            })
            rejectedPromiseHandler(consumeJob(request, log, callback), log)
            callback(null)
        })

        socket.connect()


        heartbeatInterval = setTimeout(async () => {
            if (!socket.connected) {
                log.error({
                    message: 'Not connected to server, retrying...',
                })
                return
            }
            try {
                const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
                const response = await socket.timeout(10000).emitWithAck(WebsocketServerEvent.MACHINE_HEARTBEAT, request)
                workerMachine.init(response)
            } catch (error) {
                log.error({
                    message: 'Failed to send heartbeat, retrying...',
                    error,
                })
            }
        }, 25000)

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
    async consumeJob(request: ConsumeJobRequest, callback: (data: unknown) => void): Promise<void> {
        rejectedPromiseHandler(consumeJob(request, log, callback), log)
    }
})


async function consumeJob(request: ConsumeJobRequest, log: FastifyBaseLogger, callback: (data: unknown) => void): Promise<void> {
    const { jobId, queueName, jobData, attempsStarted, engineToken } = request
    switch (queueName) {
        case QueueName.USERS_INTERACTION:
            await userInteractionJobExecutor(log).execute(jobData as unknown as UserInteractionJobData, engineToken, workerToken)
            break
        case QueueName.ONE_TIME:
            await flowJobExecutor(log).executeFlow(jobData as unknown as OneTimeJobData, attempsStarted, engineToken)
            break
        case QueueName.SCHEDULED:
            await repeatingJobExecutor(log).executeRepeatingJob({
                jobId,
                data: jobData as unknown as RepeatingJobData,
                engineToken,
                workerToken,
            })
            break
        case QueueName.WEBHOOK: {
            await webhookExecutor(log).consumeWebhook(jobId, jobData as unknown as WebhookJobData, engineToken, workerToken)
            break
        }
        case QueueName.AGENTS: {
            await agentJobExecutor(log).executeAgent({
                jobData: jobData as unknown as AgentJobData,
                engineToken,
                workerToken,
            })
            break
        }
    }
    callback(true)
}