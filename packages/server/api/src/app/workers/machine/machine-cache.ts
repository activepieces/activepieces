import { apDayjs } from '@activepieces/server-utils'
import { MachineInformation, parseToJsonIfPossible } from '@activepieces/shared'
import { redisConnections } from '../../database/redis-connections'

export type WorkerMachine = {
    id: string
    updated: string
    created: string
    information: MachineInformation
    type?: 'SHARED' | 'DEDICATED'
    workerGroupId?: string
}

const REDIS_KEY = 'workerMachines'

export const workerMachineCache = () => ({

    async find(): Promise<WorkerMachine[]> {
        const redisConnection = await redisConnections.useExisting()

        const allFields = await redisConnection.hgetall(REDIS_KEY)
        const workers: WorkerMachine[] = []

        for (const raw of Object.values(allFields)) {
            const parsed = parseToJsonIfPossible(raw) as WorkerMachine
            if (parsed && parsed.id && parsed.information) {
                workers.push(parsed)
            }
        }
        return workers
    },

    async findOne(workerId: string): Promise<WorkerMachine | null> {
        const redisConnection = await redisConnections.useExisting()

        const raw = await redisConnection.hget(REDIS_KEY, workerId)
        if (!raw) {
            return null
        }
        const parsed = parseToJsonIfPossible(raw) as WorkerMachine
        if (parsed && parsed.id && parsed.information) {
            return parsed
        }
        return null
    },

    async delete(ids: string[]): Promise<void> {
        const redisConnection = await redisConnections.useExisting()

        if (ids.length > 0) {
            await redisConnection.hdel(REDIS_KEY, ...ids)
        }
    },

    async upsert(worker: { id: string } & Partial<Omit<WorkerMachine, 'id'>>, existing?: WorkerMachine | null): Promise<void> {
        const redisConnection = await redisConnections.useExisting()

        const now = apDayjs().toISOString()
        if (existing) {
            const updated: WorkerMachine = {
                ...existing,
                ...worker,
                updated: now,
            }
            await redisConnection.hset(REDIS_KEY, worker.id, JSON.stringify(updated))
        }
        else {
            const newWorker: WorkerMachine = {
                ...worker,
                updated: now,
                created: now,
            } as WorkerMachine
            await redisConnection.hset(REDIS_KEY, worker.id, JSON.stringify(newWorker))
        }
    },
})
