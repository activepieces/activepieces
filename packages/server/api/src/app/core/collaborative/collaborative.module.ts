import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { lockModule } from './lock/lock.module'
import { presenceModule } from './presence/presence.module'

export const collaborativeModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(presenceModule)
    await app.register(lockModule)
}
