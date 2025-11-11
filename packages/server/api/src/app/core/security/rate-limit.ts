import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import RateLimitPlugin from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import FastifyPlugin from 'fastify-plugin'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'

const API_RATE_LIMIT_AUTHN_ENABLED = system.getBoolean(
    AppSystemProp.API_RATE_LIMIT_AUTHN_ENABLED,
)

export const rateLimitModule: FastifyPluginAsyncTypebox = FastifyPlugin(
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
