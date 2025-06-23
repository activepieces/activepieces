import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { flagService } from './flag.service'
import { flagHooks } from './flags.hooks'

export const flagModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flagController, { prefix: '/v1/flags' })
}

export const flagController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            logLevel: 'silent',
        },
        async (request: FastifyRequest) => {
            const flags = await flagService.getAll()
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
