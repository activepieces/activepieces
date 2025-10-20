import { rejectedPromiseHandler } from '@activepieces/server-shared'
import {  WebsocketServerEvent, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { io, Socket } from 'socket.io-client'
import { workerCache } from './cache/worker-cache'
import { engineRunner } from './compute'
import { engineRunnerSocket } from './compute/engine-runner-socket'
import { jobQueueWorker } from './consume/job-queue-worker'
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

        socket.on('connect', async () => {
            log.info({
                message: 'Connected to server',
                workerId: workerMachine.getWorkerId(),
                socketId: socket.id,
            })
            const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
            const response = await socket.timeout(10000).emitWithAck(WebsocketServerEvent.FETCH_WORKER_SETTINGS, request)
            await workerMachine.init(response, log)
            await jobQueueWorker(log).start(workerToken)
        })

        socket.on('disconnect', async () => {
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
                socket.emit(WebsocketServerEvent.WORKER_HEALTHCHECK, request)
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
        await jobQueueWorker(log).close()
    },
})

