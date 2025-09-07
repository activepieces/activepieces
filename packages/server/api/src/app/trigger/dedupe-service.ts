
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework'
import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { getRedisConnection } from '../database/redis-connection'
import { QueueMode, system } from '../helper/system/system'

const DUPLICATE_RECORD_EXPIRATION_SECONDS = 30

const MEMORY_QUEUE = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE)

export const dedupeService = {
    filterUniquePayloads: async (flowVersionId: string, payloads: unknown[]): Promise<unknown[]> => {
        const filteredPayloads = await Promise.all(payloads.map(async (payload) => isDuplicated(flowVersionId, payload)))
        return payloads.filter((_, index) => !filteredPayloads[index]).map(removeDedupeKey)
    },
}

const isDuplicated = async (flowVersionId: string, payload: unknown) => {
    const dedupeKeyValue = extractDedupeKey(payload)
    if (isNil(dedupeKeyValue)) {
        return false
    }
    const key = `${flowVersionId}:${dedupeKeyValue}`
    switch (MEMORY_QUEUE) {
        case QueueMode.REDIS: {
            const value = await incrementInRedis(key, DUPLICATE_RECORD_EXPIRATION_SECONDS)
            return value > 1
        }
        case QueueMode.MEMORY: {
            const value = await incrementInMemory(key, DUPLICATE_RECORD_EXPIRATION_SECONDS)
            return value > 1
        }
    }
}

function removeDedupeKey(payload: unknown): unknown {
    const dedupeKeyValue = extractDedupeKey(payload)
    if (isNil(dedupeKeyValue)) {
        return payload
    }
    return { ...(payload as Record<string, unknown>), [DEDUPE_KEY_PROPERTY]: undefined }
}

function extractDedupeKey(payload: unknown): unknown {
    if (isNil(payload) || typeof payload !== 'object') {
        return null
    }
    return (payload as Record<string, unknown>)[DEDUPE_KEY_PROPERTY]
}


async function incrementInRedis(key: string, expireySeconds: number): Promise<number> {
    const value = await getRedisConnection().incrby(key, 1)
    if (value > 1) {
        return value
    }
    await getRedisConnection().expire(key, expireySeconds)
    return value
}

const memoryCache: Record<string, number> = {}

async function incrementInMemory(key: string, expireySeconds: number): Promise<number> {
    memoryCache[key] = memoryCache[key] ? memoryCache[key] + 1 : 1
    setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete memoryCache[key]
    }, expireySeconds * 1000)
    return memoryCache[key]
}


