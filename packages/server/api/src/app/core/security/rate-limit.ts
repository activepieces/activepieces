import { AppSystemProp, networkUtls, QueueMode, system } from '@activepieces/server-shared'
import RateLimitPlugin from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import FastifyPlugin from 'fastify-plugin'
import { Redis } from 'ioredis'
import { createRedisClient } from '../../database/redis-connection'

const API_RATE_LIMIT_AUTHN_ENABLED = system.getBoolean(
    AppSystemProp.API_RATE_LIMIT_AUTHN_ENABLED,
)

export const rateLimitModule: FastifyPluginAsyncTypebox = FastifyPlugin(
    async (app) => {
        if (API_RATE_LIMIT_AUTHN_ENABLED) {
            await app.register(RateLimitPlugin, {
                global: false,
                keyGenerator: networkUtls.extractClientRealIp,
                redis: getRedisClient(),
            })
        }
    },
)

const getRedisClient = (): Redis | undefined => {
    const redisIsNotConfigured =
    system.get<QueueMode>(AppSystemProp.QUEUE_MODE) !== QueueMode.REDIS

    if (redisIsNotConfigured) {
        return undefined
    }

    return createRedisClient({
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
    })
}
