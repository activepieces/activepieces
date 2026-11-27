import { evlogSetup } from '@activepieces/server-utils'
import { Queue, Worker } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { getAdapter } from '../../../../../src/app/app'
import { redisConnections } from '../../../../../src/app/database/redis'
import { createDefaultRedisConnection } from '../../../../../src/app/database/redis/default-redis'
import { redisErrorLogger } from '../../../../../src/app/database/redis/redis-error-logger'
import { createSentinelRedisConnection } from '../../../../../src/app/database/redis/sentinel-redis'
import { RedisConnectionSettings } from '../../../../../src/app/database/redis/types'
import { system } from '../../../../../src/app/helper/system/system'

const jsonRecordSchema = z.record(z.string(), z.unknown())

function printedLines(spy: ReturnType<typeof vi.spyOn>): string[] {
    return spy.mock.calls.map((call) => String(call[0]))
}

function jsonLogRecords(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = []
    for (const line of printedLines(spy)) {
        try {
            const parsed: unknown = JSON.parse(line)
            const result = jsonRecordSchema.safeParse(parsed)
            if (result.success) {
                records.push(result.data)
            }
        }
        catch {
            continue
        }
    }
    return records
}

function nonJsonLines(spy: ReturnType<typeof vi.spyOn>): string[] {
    return printedLines(spy).filter((line) => {
        try {
            const parsed: unknown = JSON.parse(line)
            return !jsonRecordSchema.safeParse(parsed).success
        }
        catch {
            return true
        }
    })
}

function createErrorWithCode({ message, code }: { message: string, code?: string | number }): Error {
    return code === undefined
        ? new Error(message)
        : Object.assign(new Error(message), { code })
}

function invokeSilentEmit({ client, event, payload }: { client: Redis, event: string, payload: unknown }): void {
    const record: Record<string, unknown> = Object(client)
    const silentEmit = record['silentEmit']
    if (typeof silentEmit === 'function') {
        Reflect.apply(silentEmit, client, [event, payload])
    }
}

describe('redisErrorLogger', () => {
    const openedClients: Redis[] = []
    const openedQueues: Queue[] = []
    const openedWorkers: Worker[] = []

    let errorSpy: ReturnType<typeof vi.spyOn>
    let warnSpy: ReturnType<typeof vi.spyOn>
    let logger: FastifyBaseLogger

    function trackClient(client: Redis): Redis {
        openedClients.push(client)
        return client
    }

    beforeEach(() => {
        evlogSetup.init({
            params: {
                serviceName: 'api-test',
                logPretty: false,
                logLevel: 'info',
                drainConfig: {
                    serviceName: 'api-test',
                },
            },
        })
        logger = system.globalLogger()
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
    })

    afterEach(async () => {
        for (const worker of openedWorkers.splice(0)) {
            await worker.close(true).catch(() => undefined)
        }
        for (const queue of openedQueues.splice(0)) {
            await queue.close().catch(() => undefined)
        }
        await new Promise<void>((resolve) => {
            setImmediate(resolve)
        })
        while (openedClients.length > 0) {
            openedClients.pop()?.disconnect()
        }
        vi.restoreAllMocks()
    })

    it('attaches an error handler to standalone, url, and sentinel Redis clients', async () => {
        const standaloneSettings: RedisConnectionSettings = {
            REDIS_TYPE: 'DEFAULT',
            REDIS_HOST: '127.0.0.1',
            REDIS_PORT: '1',
        }
        const urlSettings: RedisConnectionSettings = {
            REDIS_TYPE: 'DEFAULT',
            REDIS_URL: 'redis://127.0.0.1:1',
        }
        const sentinelSettings: RedisConnectionSettings = {
            REDIS_TYPE: 'SENTINEL',
            REDIS_SENTINEL_HOSTS: 'sentinel-one:26379,sentinel-two:26379',
            REDIS_SENTINEL_NAME: 'mymaster',
            REDIS_SENTINEL_ROLE: 'master',
        }

        const standaloneClient = trackClient(await createDefaultRedisConnection(standaloneSettings))
        const urlClient = trackClient(await createDefaultRedisConnection(urlSettings))
        const sentinelClient = trackClient(await createSentinelRedisConnection(sentinelSettings))

        expect(standaloneClient.listenerCount('error')).toBeGreaterThanOrEqual(1)
        expect(urlClient.listenerCount('error')).toBeGreaterThanOrEqual(1)
        expect(sentinelClient.listenerCount('error')).toBeGreaterThanOrEqual(1)

        standaloneClient.emit('error', createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }))
        urlClient.emit('error', createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }))
        sentinelClient.emit('error', createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }))

        const resetRecords = jsonLogRecords(errorSpy).filter((record) => record['code'] === 'ECONNRESET')
        expect(resetRecords).toHaveLength(3)
        expect(nonJsonLines(errorSpy)).toEqual([])
    })

    it('emits one structured JSON record with message, stack, code, and client source', () => {
        const client = trackClient(new Redis({ lazyConnect: true }))
        redisErrorLogger.attachToRedisClient({ client, source: 'default', log: logger })

        client.emit('error', createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }))
        client.emit('error', createErrorWithCode({ message: 'plain failure' }))
        client.emit('error', new AggregateError([createErrorWithCode({ message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' })], ''))

        const records = jsonLogRecords(errorSpy)
        expect(records).toHaveLength(3)

        expect(records[0]).toMatchObject({
            level: 'error',
            msg: '[redis] Redis client error',
            code: 'ECONNRESET',
            redis: { client: 'default' },
        })
        expect(String(records[0]?.['error'])).toContain('read ECONNRESET')
        expect(String(records[0]?.['error'])).toContain('at ')

        expect(records[1]).toMatchObject({
            level: 'error',
            msg: '[redis] Redis client error',
            redis: { client: 'default' },
        })
        expect(records[1]).not.toHaveProperty('code')

        expect(records[2]).toMatchObject({
            level: 'error',
            msg: '[redis] Redis client error',
            code: 'ECONNREFUSED',
            redis: { client: 'default' },
        })
        expect(nonJsonLines(errorSpy)).toEqual([])
    })

    it('logs BullMQ queue and worker errors once without double-logging the shared connection', () => {
        const queueConnection = trackClient(new Redis({ lazyConnect: true }))
        redisErrorLogger.attachToRedisClient({ client: queueConnection, source: 'default', log: logger })

        const queue = new Queue('test-error-queue', {
            connection: queueConnection,
            skipWaitingForReady: true,
            skipVersionCheck: true,
        })
        openedQueues.push(queue)
        redisErrorLogger.attachToBullmq({
            emitter: queue,
            connection: queueConnection,
            queueName: 'test-error-queue',
            role: 'queue',
            log: logger,
        })

        const workerConnection = trackClient(new Redis({ lazyConnect: true, maxRetriesPerRequest: null }))
        redisErrorLogger.attachToRedisClient({ client: workerConnection, source: 'default', log: logger })
        let blockingClient: Redis | undefined
        const originalWorkerDuplicate = workerConnection.duplicate.bind(workerConnection)
        vi.spyOn(workerConnection, 'duplicate').mockImplementation((override) => {
            const dup = trackClient(originalWorkerDuplicate(override))
            vi.spyOn(dup, 'connect').mockResolvedValue(undefined)
            blockingClient = dup
            return dup
        })

        const worker = new Worker('test-error-worker', undefined, {
            connection: workerConnection,
            autorun: false,
            skipWaitingForReady: true,
            skipVersionCheck: true,
        })
        openedWorkers.push(worker)
        redisErrorLogger.attachToBullmq({
            emitter: worker,
            connection: workerConnection,
            queueName: 'test-error-worker',
            role: 'worker',
            log: logger,
        })

        expect(blockingClient).toBeDefined()
        queueConnection.emit('error', createErrorWithCode({ message: 'queue reset', code: 'ECONNRESET' }))
        workerConnection.emit('error', createErrorWithCode({ message: 'worker reset', code: 'ECONNRESET' }))
        blockingClient?.emit('error', createErrorWithCode({ message: 'blocking reset', code: 'ETIMEDOUT' }))

        const records = jsonLogRecords(errorSpy)
        expect(records).toHaveLength(3)
        expect(records[0]).toMatchObject({
            msg: '[bullmq] Redis connection error',
            code: 'ECONNRESET',
            queue: { name: 'test-error-queue', role: 'queue' },
        })
        expect(records[1]).toMatchObject({
            msg: '[bullmq] Redis connection error',
            code: 'ECONNRESET',
            queue: { name: 'test-error-worker', role: 'worker' },
        })
        expect(records[2]).toMatchObject({
            msg: '[bullmq] Redis connection error',
            code: 'ETIMEDOUT',
            queue: { name: 'test-error-worker', role: 'worker' },
        })
        expect(nonJsonLines(errorSpy)).toEqual([])
    })

    it('attaches error listeners to Socket.IO Redis adapter pub and sub clients', async () => {
        const baseClient = trackClient(new Redis({ lazyConnect: true }))
        const duplicatedClients: Redis[] = []
        const originalDuplicate = baseClient.duplicate.bind(baseClient)
        vi.spyOn(baseClient, 'duplicate').mockImplementation(() => {
            const dup = trackClient(originalDuplicate())
            duplicatedClients.push(dup)
            return dup
        })
        vi.spyOn(redisConnections, 'useExisting').mockResolvedValue(baseClient)

        await getAdapter(logger)

        expect(duplicatedClients).toHaveLength(2)
        const [sub, pub] = duplicatedClients

        pub.emit('error', createErrorWithCode({ message: 'pub reset', code: 'ECONNRESET' }))
        sub.emit('error', createErrorWithCode({ message: 'sub reset', code: 'ECONNRESET' }))

        expect(printedLines(warnSpy).filter((line) => line.includes('missing \'error\' handler'))).toEqual([])
        const records = jsonLogRecords(errorSpy)
        expect(records).toHaveLength(2)
        expect(records[0]).toMatchObject({
            msg: '[redis] Redis client error',
            code: 'ECONNRESET',
            redis: { client: 'socket-io-pub' },
        })
        expect(records[1]).toMatchObject({
            msg: '[redis] Redis client error',
            code: 'ECONNRESET',
            redis: { client: 'socket-io-sub' },
        })
        expect(nonJsonLines(errorSpy)).toEqual([])
    })

    it('routes ioredis silentEmit errors through the structured logger instead of unhandled console.error', async () => {
        const unhandledClient = trackClient(new Redis({ lazyConnect: true }))
        invokeSilentEmit({
            client: unhandledClient,
            event: 'error',
            payload: createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }),
        })
        expect(nonJsonLines(errorSpy).some((line) => line.includes('[ioredis] Unhandled error event:'))).toBe(true)

        errorSpy.mockClear()

        const defaultClient = trackClient(await createDefaultRedisConnection({
            REDIS_TYPE: 'DEFAULT',
            REDIS_HOST: '127.0.0.1',
            REDIS_PORT: '1',
        }))
        const sentinelClient = trackClient(await createSentinelRedisConnection({
            REDIS_TYPE: 'SENTINEL',
            REDIS_SENTINEL_HOSTS: 'sentinel-one:26379,sentinel-two:26379',
            REDIS_SENTINEL_NAME: 'mymaster',
            REDIS_SENTINEL_ROLE: 'master',
        }))

        invokeSilentEmit({
            client: defaultClient,
            event: 'error',
            payload: createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }),
        })
        invokeSilentEmit({
            client: sentinelClient,
            event: 'error',
            payload: createErrorWithCode({ message: 'read ECONNRESET', code: 'ECONNRESET' }),
        })

        const resetRecords = jsonLogRecords(errorSpy).filter((record) => record['code'] === 'ECONNRESET')
        expect(resetRecords).toHaveLength(2)
        expect(resetRecords[0]).toMatchObject({
            level: 'error',
            msg: '[redis] Redis client error',
            code: 'ECONNRESET',
            redis: { client: 'default' },
        })
        expect(resetRecords[1]).toMatchObject({
            level: 'error',
            msg: '[redis] Redis client error',
            code: 'ECONNRESET',
            redis: { client: 'sentinel' },
        })
        expect(String(resetRecords[0]?.['error'])).toContain('read ECONNRESET')
        expect(String(resetRecords[0]?.['error'])).toContain('at ')
        expect(nonJsonLines(errorSpy)).toEqual([])
    })
})
