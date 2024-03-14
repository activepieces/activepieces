import { Redis } from 'ioredis'
import { createRedisClient } from '../../database/redis-connection'
import { RunEnvironment, isNil } from '@activepieces/shared'
import { QueueMode, SystemProp, system } from 'server-shared'
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework'

const MEMORY_QUEUE = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)
const memoryCache: Record<string, number> = {}
const thirtySeconds = 30

const getRedisConnection = (() => {
    let redis: Redis | null = null

    return (): Redis => {
        if (!isNil(redis)) {
            return redis
        }
        redis = createRedisClient()
        return redis
    }
})()

export const dedupeService = {
    filterUniquePayloads: async (flowVersionId: string, payloads: unknown[], environment: RunEnvironment): Promise<unknown[]> => {
        const filteredPayloads = await Promise.all(
            payloads.map(async (payload) => {
                return isDuplicated(flowVersionId, payload, environment)
            }),
        )
        return payloads.filter((_, index) => !filteredPayloads[index]).map((payload) => {
            const dedupeKeyValue = payload && typeof payload === 'object' ? (payload as Record<string, unknown>)[DEDUPE_KEY_PROPERTY] : null
            if (isNil(dedupeKeyValue)) {
                return payload
            }
            return { ...(payload as Record<string, unknown>), [DEDUPE_KEY_PROPERTY]: null }
        })
    },
}

const isDuplicated = async (flowVersionId: string, payload: unknown, environment: RunEnvironment) => {
    if (environment === RunEnvironment.TESTING) {
        return false
    }
    const dedupeKeyValue = payload && typeof payload === 'object' ? (payload as Record<string, unknown>)[DEDUPE_KEY_PROPERTY] : null
    if (isNil(dedupeKeyValue)) {
        return false
    }
    const key = `${flowVersionId}:${dedupeKeyValue}`
    const incValue = await increment(key)
    const isDuplicated = incValue > 1
    return isDuplicated
}


async function increment(key: string): Promise<number> {
    switch (MEMORY_QUEUE) {
        case QueueMode.REDIS: {
            const value = await getRedisConnection().incrby(key, 1)
            if (value > 1) {
                return value
            }
            await getRedisConnection().expire(key, thirtySeconds)
            return value
        }
        case QueueMode.MEMORY: {
            memoryCache[key] = memoryCache[key] ? memoryCache[key] + 1 : 1
            expireMemoryCache(key)
            return memoryCache[key]
        }
    }
}

function expireMemoryCache(key: string): void {
    setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete memoryCache[key]
    }, thirtySeconds * 1000)
}
