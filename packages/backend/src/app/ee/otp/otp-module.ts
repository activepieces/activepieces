import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpController } from './otp-controller'

export const otpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(otpController, { prefix: '/v1/otp' })
}
