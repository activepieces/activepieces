import os from 'os'
import { parseToJsonIfPossible } from '@activepieces/core-utils'
import { apDayjs, apVersionUtil, systemUsage } from '@activepieces/server-utils'
import { AppInstance } from '@activepieces/shared'
import { redisConnections } from '../database/redis-connections'

// Apps are stateless behind the load balancer and, unlike workers, have no inbound healthcheck
// connection to register over — so each app writes its own row into this hash on its metrics tick.
// An app dies without a disconnect event, so `list` treats a row untouched for OFFLINE_AFTER_MS as
// gone: it is excluded and cleaned up in the same read. Deliberately separate from the workerMachines
// hash so an app is never counted as a worker execution slot by worker-capacity.
export const appMachineCache = {
    async register(eventLoopDelayMs: number): Promise<void> {
        const [cpuCores, memory, disk, cpuPressure] = await Promise.all([
            systemUsage.getCpuCores(),
            systemUsage.getContainerMemoryUsage(),
            systemUsage.getDiskInfo(),
            systemUsage.getCpuPressure(),
        ])
        const instance: AppInstance = {
            hostname: os.hostname(),
            version: apVersionUtil.getCurrentRelease(),
            cpuCores,
            cpuUsagePercentage: systemUsage.getCpuUsage(),
            ramTotalBytes: memory.totalRamInBytes,
            ramUsagePercentage: memory.ramUsage,
            diskPercentage: disk.percentage,
            eventLoopDelayMs,
            ...cpuPressure,
            updated: apDayjs().toISOString(),
        }
        const redisConnection = await redisConnections.useExisting()
        await redisConnection.hset(REDIS_KEY, instance.hostname, JSON.stringify(instance))
    },

    async list(): Promise<AppInstance[]> {
        const redisConnection = await redisConnections.useExisting()
        const allFields = await redisConnection.hgetall(REDIS_KEY)

        const now = apDayjs().valueOf()
        const live: AppInstance[] = []
        const stale: string[] = []
        for (const [hostname, raw] of Object.entries(allFields)) {
            const parsed = parseToJsonIfPossible(raw) as AppInstance | undefined
            const isOffline = !parsed || !parsed.updated || now - apDayjs(parsed.updated).valueOf() > OFFLINE_AFTER_MS
            if (isOffline) {
                stale.push(hostname)
                continue
            }
            live.push(parsed)
        }
        if (stale.length > 0) {
            await redisConnection.hdel(REDIS_KEY, ...stale)
        }
        return live
    },
}

const REDIS_KEY = 'appMachines'
// Two missed 60s metrics ticks: a row older than this is a dead replica, not a live one.
const OFFLINE_AFTER_MS = 120_000
