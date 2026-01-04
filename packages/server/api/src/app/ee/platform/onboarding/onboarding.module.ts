import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { onboardingController } from './onboarding.controller'

export const onboardingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(onboardingController, { prefix: '/v1/onboarding' })
}
