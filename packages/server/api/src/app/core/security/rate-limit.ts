import RateLimitPlugin from '@fastify/rate-limit'
import FastifyPlugin from 'fastify-plugin'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { redisConnections } from '../../database/redis-connections'
import { networkUtils } from '../../helper/network-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

const API_RATE_LIMIT_AUTHN_ENABLED = system.getBoolean(
    AppSystemProp.API_RATE_LIMIT_AUTHN_ENABLED,
)

export const rateLimitModule: FastifyPluginAsyncZod = FastifyPlugin(
    async (app) => {
        if (API_RATE_LIMIT_AUTHN_ENABLED) {
            await app.register(RateLimitPlugin, {
                global: false,
                keyGenerator: (req) => networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
                redis: await redisConnections.create(),
            })
        }
    },
)
