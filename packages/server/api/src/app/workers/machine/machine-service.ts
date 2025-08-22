import {
    MachineInformation,
    WebsocketClientEvent,
    WorkerMachineHealthcheckResponse,
    WorkerMachineStatus,
    WorkerMachineWithStatus,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { WorkerMachineEntity } from './machine-entity'
import { Socket } from 'socket.io'
import { AppSystemProp, QueueName, WorkerSystemProp } from '@activepieces/server-shared'
import { QueueMode, system } from '../../helper/system/system'
import { domainHelper } from '../../ee/custom-domains/domain-helper'
import { simpleRouting } from './routing/simple-routing'
import { distributedRouting } from './routing/distributed-routing'
import { redisQueue } from '../redis/redis-queue'
import { FastifyBaseLogger } from 'fastify'

const machineRouting = system.getOrThrow(AppSystemProp.QUEUE_MODE) === QueueMode.MEMORY ? simpleRouting : distributedRouting
const workerRepo = repoFactory(WorkerMachineEntity)
const OFFLINE_THRESHOLD = dayjs.duration(60, 's').asMilliseconds()

export const machineService = (log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            await workerRepo().delete({ id: request.workerId })
            await machineRouting.onDisconnect({
                workerId: request.workerId,
            })
            await updateConcurrency(log)
        },
        async acquire(): Promise<string> {
            return machineRouting.acquire()
        },
        async release(workerId: string): Promise<void> {
            await machineRouting.release(workerId)
        },
        async onHeartbeat({
            workerId,
            sandboxUsed,
            diskInfo,
            cpuUsagePercentage,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            workerProps,
            ip,
        }: OnHeartbeatParams): Promise<WorkerMachineHealthcheckResponse> {
            await machineRouting.onHeartbeat({
                workerId,
                sandboxUsed,
            })
            await workerRepo().upsert({
                information: {
                    diskInfo,
                    cpuUsagePercentage,
                    ramUsagePercentage,
                    totalAvailableRamInBytes,
                    workerProps,
                    ip,
                },
                updated: dayjs().toISOString(),
                id: workerId,
            }, ['id'])

            const response: WorkerMachineHealthcheckResponse = {
                TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
                PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                EXECUTION_MODE: system.getOrThrow(AppSystemProp.EXECUTION_MODE),
                FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
                FLOW_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.FLOW_WORKER_CONCURRENCY),
                SCHEDULED_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.SCHEDULED_WORKER_CONCURRENCY),
                AGENTS_WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.AGENTS_WORKER_CONCURRENCY),
                LOG_LEVEL: system.getOrThrow(AppSystemProp.LOG_LEVEL),
                LOG_PRETTY: system.getOrThrow(AppSystemProp.LOG_PRETTY),
                ENVIRONMENT: system.getOrThrow(AppSystemProp.ENVIRONMENT),
                APP_WEBHOOK_SECRETS: system.getOrThrow(AppSystemProp.APP_WEBHOOK_SECRETS),
                MAX_FILE_SIZE_MB: system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB),
                SANDBOX_MEMORY_LIMIT: system.getOrThrow(AppSystemProp.SANDBOX_MEMORY_LIMIT),
                SANDBOX_PROPAGATED_ENV_VARS: system.get(AppSystemProp.SANDBOX_PROPAGATED_ENV_VARS)?.split(',').map(f => f.trim()) ?? [],
                PIECES_SOURCE: system.getOrThrow(AppSystemProp.PIECES_SOURCE),
                DEV_PIECES: system.get(AppSystemProp.DEV_PIECES)?.split(',') ?? [],
                SENTRY_DSN: system.get(AppSystemProp.SENTRY_DSN),
                LOKI_PASSWORD: system.get(AppSystemProp.LOKI_PASSWORD),
                LOKI_URL: system.get(AppSystemProp.LOKI_URL),
                LOKI_USERNAME: system.get(AppSystemProp.LOKI_USERNAME),
                OTEL_ENABLED: system.get(AppSystemProp.OTEL_ENABLED) === 'true',
                PUBLIC_URL: await domainHelper.getPublicUrl({
                    path: '',
                }),
                FILE_STORAGE_LOCATION: system.getOrThrow(AppSystemProp.FILE_STORAGE_LOCATION),
                S3_USE_SIGNED_URLS: system.getOrThrow(AppSystemProp.S3_USE_SIGNED_URLS),
            }

            await updateConcurrency(log)

            return response
        },
        async list(): Promise<WorkerMachineWithStatus[]> {
            const workers = await workerRepo().createQueryBuilder('machine').where('machine.updated > :updated', { updated: new Date(dayjs().subtract(OFFLINE_THRESHOLD, 'ms').toISOString()) }).getMany()
            return workers.map(worker => {
                const isOnline = dayjs(worker.updated).isAfter(dayjs().subtract(OFFLINE_THRESHOLD, 'ms').toISOString())
                return { ...worker, status: isOnline ? WorkerMachineStatus.ONLINE : WorkerMachineStatus.OFFLINE }
            })
        }
    }
}
async function updateConcurrency(log: FastifyBaseLogger): Promise<void> {
    const machines = await machineService(log).list()
    const flowWorkerConcurrency = machines.reduce((acc, machine) => acc + (parseInt(machine.information.workerProps[WorkerSystemProp.FLOW_WORKER_CONCURRENCY]) || 0), 0)
    const scheduledWorkerConcurrency = machines.reduce((acc, machine) => acc + (parseInt(machine.information.workerProps[WorkerSystemProp.SCHEDULED_WORKER_CONCURRENCY]) || 0), 0)
    const agentsWorkerConcurrency = machines.reduce((acc, machine) => acc + (parseInt(machine.information.workerProps[WorkerSystemProp.AGENTS_WORKER_CONCURRENCY]) || 0), 0)
    await redisQueue(log).setConcurrency(QueueName.ONE_TIME, flowWorkerConcurrency)
    await redisQueue(log).setConcurrency(QueueName.SCHEDULED, scheduledWorkerConcurrency)
    await redisQueue(log).setConcurrency(QueueName.AGENTS, agentsWorkerConcurrency)
    await redisQueue(log).setConcurrency(QueueName.WEBHOOK, flowWorkerConcurrency)
}

type OnDisconnectParams = {
    socket: Socket
    workerId: string
}

type OnHeartbeatParams = {
    socket: Socket
    workerId: string
    cpuUsagePercentage: number
    diskInfo: MachineInformation['diskInfo']
    ramUsagePercentage: number
    totalAvailableRamInBytes: number
    ip: string
    sandboxUsed: number
    workerProps: Record<string, string>
}