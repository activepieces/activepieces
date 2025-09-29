
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import { redisConnections } from '../database/redis'

const DUPLICATE_RECORD_EXPIRATION_SECONDS = 30

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
    const value = await incrementInRedis(key, DUPLICATE_RECORD_EXPIRATION_SECONDS)
    return value > 1
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
    const redisConnection = await redisConnections.useExisting()
    const value = await redisConnection.incrby(key, 1)
    if (value > 1) {
        return value
    }
    await redisConnection.expire(key, expireySeconds)
    return value
}

