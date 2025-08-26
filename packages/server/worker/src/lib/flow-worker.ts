import { readdir, rm } from 'fs/promises'
import path from 'path'
import { AgentJobData, exceptionHandler, GLOBAL_CACHE_ALL_VERSIONS_PATH, JobData, JobStatus, LATEST_CACHE_VERSION, OneTimeJobData, QueueName, rejectedPromiseHandler, RepeatingJobData, UserInteractionJobData, WebhookJobData } from '@activepieces/server-shared'
import { ConsumeJobRequest, ConsumeJobResponse, isNil, WebsocketClientEvent, WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
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
import { inspect } from 'util'

let workerToken: string
let heartbeatInterval: NodeJS.Timeout
let socket: Socket

export const flowWorker = (log: FastifyBaseLogger) => ({
    async init({ workerToken: token }: { workerToken: string }): Promise<void> {
        rejectedPromiseHandler(deleteStaleCache(log), log)
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
                await consumeJob(request, log)
                const response: ConsumeJobResponse = {
                    success: true,
                }
                callback(response)
            }
            catch (error) {
                log.info({
                    message: 'Failed to consume job',
                    error,
                })
                const response: ConsumeJobResponse = {
                    success: false,
                    message: inspect(error),
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


async function consumeJob(request: ConsumeJobRequest, log: FastifyBaseLogger): Promise<void> {
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
}

async function deleteStaleCache(log: FastifyBaseLogger): Promise<void> {
    try {
        const cacheDir = path.resolve(GLOBAL_CACHE_ALL_VERSIONS_PATH)
        const entries = await readdir(cacheDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== LATEST_CACHE_VERSION) {
                await rm(path.join(cacheDir, entry.name), { recursive: true })
            }
        }
    }
    catch (error) {
        exceptionHandler.handle(error, log)
    }
}