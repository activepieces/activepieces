import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flagService } from './flag.service'

export const flagModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flagController, { prefix: '/v1/flags' })
}

export const flagController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            logLevel: 'silent',
        },
        async () => {
            const flags = await flagService.getAll()
            const flagMap: Record<string, unknown> = {}
            flags.forEach((flag) => {
                flagMap[flag.id as string] = flag.value
            })
            return flagMap
        },
    )
}
