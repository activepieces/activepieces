import Redis from 'ioredis'
import { afterEach, describe, expect, it } from 'vitest'
import { createDefaultRedisConnection } from '../../../../../src/app/database/redis/default-redis'
import { createSentinelRedisConnection } from '../../../../../src/app/database/redis/sentinel-redis'
import { RedisConnectionSettings } from '../../../../../src/app/database/redis/types'

const SOCKET_TIMEOUT_IN_MS = 30_000
const LONGEST_BLOCKING_COMMAND_IN_MS = 15_000

const openedClients: Redis[] = []

function track(client: Redis): Redis {
    client.on('error', () => undefined)
    openedClients.push(client)
    return client
}

const sentinelSettings: RedisConnectionSettings = {
    REDIS_TYPE: 'SENTINEL',
    REDIS_SENTINEL_HOSTS: 'sentinel-one:26379,sentinel-two:26379',
    REDIS_SENTINEL_NAME: 'mymaster',
    REDIS_SENTINEL_ROLE: 'master',
}

const standaloneSettings: RedisConnectionSettings = {
    REDIS_TYPE: 'DEFAULT',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '1',
}

afterEach(() => {
    while (openedClients.length > 0) {
        openedClients.pop()?.disconnect()
    }
})

describe('redis connection failure detection', () => {
    it('arms socketTimeout and keepAlive on sentinel connections', async () => {
        const client = track(await createSentinelRedisConnection(sentinelSettings))

        expect(client.options.socketTimeout).toBe(SOCKET_TIMEOUT_IN_MS)
        expect(client.options.keepAlive).toBe(5_000)
        expect(client.options.maxRetriesPerRequest).toBeNull()
    })

    it('arms socketTimeout and keepAlive on standalone connections', async () => {
        const client = track(await createDefaultRedisConnection(standaloneSettings))

        expect(client.options.socketTimeout).toBe(SOCKET_TIMEOUT_IN_MS)
        expect(client.options.keepAlive).toBe(5_000)
        expect(client.options.maxRetriesPerRequest).toBeNull()
    })

    it('keeps socketTimeout on the duplicated connection BullMQ blocks on', async () => {
        const client = track(await createSentinelRedisConnection(sentinelSettings))
        const blockingClient = track(client.duplicate())

        expect(blockingClient.options.socketTimeout).toBe(SOCKET_TIMEOUT_IN_MS)
    })

    it('leaves headroom above the longest blocking command so healthy polls are never severed', async () => {
        const client = track(await createSentinelRedisConnection(sentinelSettings))

        expect(client.options.socketTimeout).toBeGreaterThan(LONGEST_BLOCKING_COMMAND_IN_MS)
    })
})
