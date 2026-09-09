import { partition } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import type { WorkerMachine } from './machine-cache'

function partitionByLiveness(workers: WorkerMachine[]): WorkerLivenessPartition {
    const offlineThreshold = apDayjs().subtract(WORKER_OFFLINE_AFTER_SECONDS, 'seconds').utc()
    const [online, offline] = partition(workers, (worker) => apDayjs(worker.updated).isAfter(offlineThreshold))
    return { online, offline }
}

export const workerLiveness = { partitionByLiveness }

export const WORKER_OFFLINE_AFTER_SECONDS = 60

export type WorkerLivenessPartition = {
    online: WorkerMachine[]
    offline: WorkerMachine[]
}
