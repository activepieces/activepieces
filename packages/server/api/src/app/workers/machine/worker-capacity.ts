import { isNil } from '@activepieces/core-utils'
import { WorkerGroupScope } from '@activepieces/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { workerMachineCache } from './machine-cache'

dayjs.extend(utc)

export function parseWorkerConcurrency(value: string | undefined): number {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

// In-memory live-capacity ( aka sum of WORKER_CONCURRENCY in a group) view of the machine cache, read on every routable enqueue
// (routing + rate limiting). Cached without a TTL and invalidated only when the set of
// workers changes — a new worker connects or a worker disconnects (see machine-service
// onConnection/onDisconnect). Ordinary heartbeats from known workers don't change capacity.
let capacitySnapshot: WorkerCapacitySnapshot | null = null


export const workerCapacity = {
    async get(): Promise<WorkerCapacitySnapshot> {
        if (!isNil(capacitySnapshot)) {
            return capacitySnapshot
        }
        const allWorkers = await workerMachineCache().find()
        const offlineThreshold = dayjs().subtract(60, 'seconds').utc()
        const projectGroups = new Map<string, PoolCapacity>()
        const shared: PoolCapacity = { slots: 0, online: 0 }
        for (const worker of allWorkers) {
            if (!dayjs(worker.updated).isAfter(offlineThreshold)) {
                continue
            }
            const slots = parseWorkerConcurrency(worker.information.workerProps.WORKER_CONCURRENCY)
            if (worker.workerGroupScope === WorkerGroupScope.PROJECT && !isNil(worker.workerGroupId) && worker.workerGroupId.length > 0) {
                const current = projectGroups.get(worker.workerGroupId) ?? { slots: 0, online: 0 }
                projectGroups.set(worker.workerGroupId, { slots: current.slots + slots, online: current.online + 1 })
            }
            else if (isNil(worker.workerGroupScope)) {
                shared.slots += slots
                shared.online += 1
            }
        }
        capacitySnapshot = { projectGroups, shared }
        return capacitySnapshot
    },
    invalidate(): void {
        capacitySnapshot = null
    },
}

export type PoolCapacity = {
    slots: number
    online: number
}

export type WorkerCapacitySnapshot = {
    projectGroups: Map<string, PoolCapacity>
    shared: PoolCapacity
}
