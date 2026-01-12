import { apDayjs } from '@activepieces/server-shared'
import { MachineInformation, parseToJsonIfPossible } from '@activepieces/shared'
import { redisConnections } from '../../database/redis-connections'

export type WorkerMachine = {
    id: string
    updated: string
    created: string
    information: MachineInformation
}

const REDIS_KEY = 'workerMachines'

export const workerMachineCache = () => ({

    async find(): Promise<WorkerMachine[]> {
        const redisConnection = await redisConnections.useExisting()

        const keys = await redisConnection.keys(`${REDIS_KEY}:*`)
        if (!keys || keys.length === 0) {
            return []
        }

        const workerMachinesRaw = await redisConnection.mget(keys)
        const workers: WorkerMachine[] = []

        for (let i = 0; i < workerMachinesRaw.length; i++) {
            const raw = workerMachinesRaw[i]
            if (!raw) {
                continue
            }
            const parsed = parseToJsonIfPossible(raw) as WorkerMachine
            if (parsed && parsed.id && parsed.information) {
                workers.push(parsed)
            }
        }
        return workers
    },

    async delete(ids: string[]): Promise<void> {
        const redisConnection = await redisConnections.useExisting()

        const keys = ids.map(id => `${REDIS_KEY}:${id}`)
        if (keys.length > 0) {
            await redisConnection.del(...keys)
        }
    },

    async upsert(worker: { id: string } & Partial<Omit<WorkerMachine, 'id'>>): Promise<void> {
        const redisConnection = await redisConnections.useExisting()

        const key = `${REDIS_KEY}:${worker.id}`
        const now = apDayjs().toISOString()
        const existingRaw = await redisConnection.get(key)
        if (existingRaw) {
            const existing: WorkerMachine = parseToJsonIfPossible(existingRaw) as WorkerMachine
            const updated: WorkerMachine = {
                ...existing,
                ...worker,
                updated: now,
            }
            await redisConnection.set(key, JSON.stringify(updated))
        }
        else {
            const newWorker: WorkerMachine = {
                ...worker,
                updated: now,
                created: now,
            } as WorkerMachine
            await redisConnection.set(key, JSON.stringify(newWorker))
        }
    }, 
})