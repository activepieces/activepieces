import RateLimitPlugin from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import FastifyPlugin from 'fastify-plugin'
import { Redis } from 'ioredis'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { FastifyRequest } from 'fastify'

const CLIENT_REAL_IP_HEADER = system.getOrThrow(SystemProp.CLIENT_REAL_IP_HEADER)
const API_RATE_LIMIT_AUTHN_ENABLED = system.getBoolean(SystemProp.API_RATE_LIMIT_AUTHN_ENABLED)

export const rateLimitModule: FastifyPluginAsyncTypebox = FastifyPlugin(async (app) => {
    if (API_RATE_LIMIT_AUTHN_ENABLED) {
        await app.register(RateLimitPlugin, {
            global: false,
            keyGenerator: extractClientRealIp,
            redis: getRedisClient(),
        })
    }
})

export const extractClientRealIp = (request: FastifyRequest): string => {
    return request.headers[CLIENT_REAL_IP_HEADER] as string
}

const getRedisClient = (): Redis | undefined => {
    const redisIsNotConfigured = system.get<QueueMode>(SystemProp.QUEUE_MODE) !== QueueMode.REDIS

    if (redisIsNotConfigured) {
        return undefined
    }

    return createRedisClient({
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
    })
}
