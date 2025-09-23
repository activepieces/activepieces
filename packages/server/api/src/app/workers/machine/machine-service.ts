import { AppSystemProp, QueueName, WorkerSystemProp } from '@activepieces/server-shared'
import {
    MachineInformation,
    WorkerMachineHealthcheckResponse,
    WorkerMachineStatus,
    WorkerMachineWithStatus,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { domainHelper } from '../../helper/domain-helper'
import { system } from '../../helper/system/system'
import { app } from '../../server'
import { jobQueue } from '../queue/job-queue'
import { WorkerMachineEntity } from './machine-entity'
import { machineRouting } from './machine-routing'

const workerRepo = repoFactory(WorkerMachineEntity)
const OFFLINE_THRESHOLD = dayjs.duration(60, 's').asMilliseconds()

export const machineService = (log: FastifyBaseLogger) => {
    return {
        async onDisconnect(request: OnDisconnectParams): Promise<void> {
            system.globalLogger().info({
                message: 'Worker disconnected',
                workerId: request.workerId,
            })
            await workerRepo().delete({ id: request.workerId })
            await machineRouting.onDisconnect({
                workerId: request.workerId,
            })
            await machineService(log).updateConcurrency()
        },
        async acquire(): Promise<string> {
            const workerId = await machineRouting.acquire()
            const sockets = await app?.io.to(workerId).fetchSockets()
            if (sockets && sockets.length > 0) {
                return workerId
            }
            else {
                await machineService(log).onDisconnect({
                    workerId,
                })
                return machineService(log).acquire()
            }
        },
        async release(workerId: string): Promise<void> {
            await machineRouting.release(workerId)
        },
        async getConcurrency(): Promise<Record<QueueName, number>> {
            const machines = await machineService(log).list()
            const flowWorkerConcurrency = machines.reduce((acc, machine) => acc + (parseInt(machine.information.workerProps[WorkerSystemProp.WORKER_CONCURRENCY]) || 0), 0)
            return {
                [QueueName.WORKER_JOBS]: flowWorkerConcurrency,
            }
        },
        async updateConcurrency(): Promise<void> {
            const concurrency = await machineService(log).getConcurrency()
            await Promise.all(Object.entries(concurrency).map(([queueName, concurrency]) => jobQueue(log).setConcurrency(queueName as QueueName, concurrency)))
        },
        async onHeartbeat({
            workerId,
            totalSandboxes,
            diskInfo,
            cpuUsagePercentage,
            ramUsagePercentage,
            totalAvailableRamInBytes,
            workerProps,
            ip,
            freeSandboxes,
        }: OnHeartbeatParams): Promise<WorkerMachineHealthcheckResponse> {
            await machineRouting.onHeartbeat({
                workerId,
                totalSandboxes,
                freeSandboxes,
            })
            await workerRepo().upsert({
                information: {
                    diskInfo,
                    cpuUsagePercentage,
                    ramUsagePercentage,
                    totalAvailableRamInBytes,
                    workerProps,
                    ip,
                    totalSandboxes,
                    freeSandboxes,
                },
                updated: dayjs().toISOString(),
                id: workerId,
            }, ['id'])

            const response: WorkerMachineHealthcheckResponse = {
                TRIGGER_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
                PAUSED_FLOW_TIMEOUT_DAYS: system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS),
                EXECUTION_MODE: system.getOrThrow(AppSystemProp.EXECUTION_MODE),
                FLOW_TIMEOUT_SECONDS: system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
                WORKER_CONCURRENCY: system.getNumberOrThrow(WorkerSystemProp.WORKER_CONCURRENCY),
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

            await machineService(log).updateConcurrency()

            return response
        },
        async list(): Promise<WorkerMachineWithStatus[]> {
            const offlineThreshold = dayjs().subtract(OFFLINE_THRESHOLD, 'ms').utc()
            const allWorkers = await workerRepo().find()
            const workersToDelete = allWorkers.filter(worker => dayjs(worker.updated).isBefore(offlineThreshold))

            if (workersToDelete.length > 0) {
                await workerRepo().delete({
                    id: In(workersToDelete.map(worker => worker.id)),
                })
            }

            const onlineWorkers = allWorkers.filter(worker => dayjs(worker.updated).isAfter(offlineThreshold))
            return onlineWorkers.map(worker => ({
                ...worker,
                status: WorkerMachineStatus.ONLINE,
            }))
        },
    }
}

type OnDisconnectParams = {
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
    totalSandboxes: number
    freeSandboxes: number
    workerProps: Record<string, string>
}
