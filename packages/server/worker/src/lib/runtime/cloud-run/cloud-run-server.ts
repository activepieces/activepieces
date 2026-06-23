import os from 'os'
import { type Runtime, type RuntimeExecutorInfo } from '@activepieces/sandbox-pool'
import { ConsumeJobRequest, WorkerToApiContract } from '@activepieces/shared'
import Fastify, { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { Socket } from 'socket.io-client'
import { system, WorkerSystemProp } from '../../config/configs'
import { logger } from '../../config/logger'
import { createApiConnection, fetchAndStoreSettings, runJob } from '../../execute/job-runner'
import { createCloudRunRuntime } from '../cloud-run-runtime'

const EXECUTE_PATH = '/v1/execute'
const HEALTH_PATH = '/health'
const MAX_BODY_BYTES = 5 * 1024 * 1024

const workerId = `cloud-run-${nanoid()}`
const workerHostname = os.hostname()

let socket: Socket | null = null
let apiClient: WorkerToApiContract | null = null
let runtime: Runtime | null = null
let app: FastifyInstance | null = null
let ready = false
let busy = false

function getActiveExecutors(): RuntimeExecutorInfo[] {
    return runtime?.getActiveExecutors() ?? []
}

export const cloudRunServer = {
    async start({ socketUrl, workerToken, port }: StartCloudRunServerParams): Promise<void> {
        const workerGroupId = system.get(WorkerSystemProp.WORKER_GROUP_ID)
        const connection = createApiConnection({ socketUrl, workerToken, workerId, workerGroupId })
        socket = connection.socket
        apiClient = connection.apiClient
        runtime = createCloudRunRuntime({ log: logger })

        socket.on('connect', async () => {
            logger.info('Connected to API server via Socket.IO')
            await fetchAndStoreSettings({ sock: socket!, workerId, workerHostname, getActiveExecutors })
            ready = true
            logger.info('Cloud Run instance ready to accept jobs')
        })

        socket.on('disconnect', (reason) => {
            ready = false
            logger.warn({ reason }, 'Disconnected from API server')
        })

        socket.on('connect_error', (error) => {
            logger.error({ error: error.message }, 'Socket.IO connection error')
        })

        app = Fastify({ logger: false, bodyLimit: MAX_BODY_BYTES })
        registerRoutes(app)
        // host 0.0.0.0 is required on Cloud Run — Fastify defaults to 127.0.0.1, which fails the port probe.
        await app.listen({ port, host: '0.0.0.0' })
        logger.info({ port }, 'Cloud Run execution server listening')
    },

    async stop(): Promise<void> {
        ready = false
        if (app) {
            await app.close()
            app = null
        }
        if (runtime) {
            await runtime.shutdown(logger)
            runtime = null
        }
        socket?.disconnect()
        socket = null
        logger.info('Cloud Run execution server stopped')
    },
}

function registerRoutes(instance: FastifyInstance): void {
    instance.get(HEALTH_PATH, async (_request, reply) =>
        reply.code(ready ? 200 : 503).send({ status: ready ? 'ok' : 'starting' }),
    )

    // The dispatcher pushes one ConsumeJobRequest per request and holds it open for the run's duration.
    // Cloud Run's --concurrency=1 guarantees one at a time; the busy guard is defense-in-depth.
    instance.post(EXECUTE_PATH, async (request, reply) => {
        if (!ready || apiClient === null || runtime === null) {
            return reply.code(503).send({ error: 'not_ready' })
        }
        if (busy) {
            return reply.code(429).send({ error: 'busy' })
        }
        const parsed = ConsumeJobRequest.safeParse(request.body)
        if (!parsed.success) {
            logger.warn({ error: parsed.error }, 'Rejected malformed execute request')
            return reply.code(400).send({ error: 'invalid_job' })
        }
        const job = parsed.data

        busy = true
        const jobLog = logger.child({ job: { id: job.jobId, type: job.jobData.jobType } })
        jobLog.info('Cloud Run job received via HTTP push')
        try {
            const status = await runJob({ apiClient, runtime, job, workerIndex: 0, log: jobLog })
            return await reply.code(200).send({ jobId: job.jobId, status })
        }
        catch (error) {
            jobLog.error({ error }, 'Cloud Run job execution crashed')
            return await reply.code(500).send({ jobId: job.jobId, error: 'execution_failed' })
        }
        finally {
            busy = false
        }
    })
}

type StartCloudRunServerParams = {
    socketUrl: { url: string, path: string }
    workerToken: string
    port: number
}
