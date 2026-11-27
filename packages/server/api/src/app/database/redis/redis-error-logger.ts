import { isNil, spreadIfDefined, toError } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import { system } from '../../helper/system/system'

const bullmqOwnedConnections = new WeakSet<Redis>()

export const redisErrorLogger = {
    attachToRedisClient({ client, source, log }: AttachToRedisClientParams): void {
        client.on('error', (error: unknown): void => {
            if (bullmqOwnedConnections.has(client) && client.listenerCount('error') > 1) {
                return
            }
            logRedisError({
                error,
                context: {
                    redis: {
                        client: source,
                    },
                },
                message: '[redis] Redis client error',
                log,
            })
        })
    },

    attachToBullmq({ emitter, connection, queueName, role, log }: AttachToBullmqParams): void {
        if (!isNil(connection)) {
            bullmqOwnedConnections.add(connection)
        }
        emitter.on('error', (error: Error): void => {
            logRedisError({
                error,
                context: {
                    queue: {
                        name: queueName,
                        role,
                    },
                },
                message: '[bullmq] Redis connection error',
                log,
            })
        })
    },
}

function logRedisError({ error, context, message, log }: LogRedisErrorParams): void {
    const logger = log ?? system.globalLogger()
    const normalizedError = toError(error)
    const code = readErrorCode(error)
    logger.error(
        {
            error: normalizedError,
            ...spreadIfDefined('code', code),
            ...context,
        },
        message,
    )
}

function readErrorCode(error: unknown): string | number | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = error.code
        if (typeof code === 'string' && code.length > 0) {
            return code
        }
        if (typeof code === 'number') {
            return code
        }
    }
    if (error instanceof AggregateError && error.errors.length > 0) {
        return readErrorCode(error.errors[0])
    }
    return undefined
}

export type RedisClientSource = 'default' | 'sentinel' | 'memory' | 'socket-io-pub' | 'socket-io-sub'

export type BullmqRole = 'queue' | 'worker'

export type BullmqErrorEmitter = {
    on: (event: 'error', listener: (error: Error) => void) => unknown
}

type AttachToRedisClientParams = {
    client: Redis
    source: RedisClientSource
    log?: FastifyBaseLogger
}

type AttachToBullmqParams = {
    emitter: BullmqErrorEmitter
    connection?: Redis
    queueName: string
    role: BullmqRole
    log?: FastifyBaseLogger
}

type LogRedisErrorParams = {
    error: unknown
    context: Record<string, unknown>
    message: string
    log?: FastifyBaseLogger
}
