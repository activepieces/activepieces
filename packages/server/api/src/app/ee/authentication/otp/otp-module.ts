import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { otpController } from './otp-controller'

export const otpModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(otpController, { prefix: '/v1/otp' })
}
