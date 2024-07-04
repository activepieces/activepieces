import { spreadIfDefined, WorkerMachineStatus, WorkerMachineWithStatus, WorkerPrincipal } from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { WorkerMachineEntity } from './machine-entity'

const workerRepo = repoFactory(WorkerMachineEntity)
const OFFLINE_THRESHOLD = dayjs.duration(60, 's').asMilliseconds()

export const machineService = {
    async upsert(request: UpsertParams): Promise<void> {
        await workerRepo().upsert({
            cpuUsage: request.cpuUsage,
            ramUsage: request.ramUsage,
            totalRamInBytes: request.totalRamInBytes,
            updated: dayjs().toISOString(),
            id: request.workerPrincipal.id,
            ...spreadIfDefined('platformId', request.workerPrincipal.platform?.id),
            type: request.workerPrincipal.worker.type,
        }, ['id'])
    },
    async list(): Promise<WorkerMachineWithStatus[]> {
        const workers = await workerRepo().createQueryBuilder('machine').where('machine.updated > :updated', { updated: new Date(dayjs().subtract(OFFLINE_THRESHOLD, 'ms').toISOString()) }).getMany()
        return workers.map(worker => {
            const isOnline = dayjs(worker.updated).isAfter(dayjs().subtract(OFFLINE_THRESHOLD, 'ms').toISOString())
            return { ...worker, status: isOnline ? WorkerMachineStatus.ONLINE : WorkerMachineStatus.OFFLINE }
        })
    },
}

type UpsertParams = {
    cpuUsage: number
    ramUsage: number
    totalRamInBytes: number
    workerPrincipal: WorkerPrincipal
}