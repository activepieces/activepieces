import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flagService } from './flag.service'
import { flagHooks } from './flags.hooks'

export const flagModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(flagController, { prefix: '/v1/flags' })
}

export const flagController: FastifyPluginAsyncZod = async (app) => {
    app.get(
        '/',
        {
            config: {
                security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
            },
            logLevel: 'silent',
        },
        async (request: FastifyRequest) => {
            const flags = await flagService(request.log).getAll()
            const flagsMap: Record<string, string | boolean | number | Record<string, unknown>> = flags.reduce(
                (map, flag) => ({ ...map, [flag.id as string]: flag.value }),
                {},
            )
            return flagHooks.get().modify({
                flags: flagsMap,
                request,
            })
        },
    )
    
}
