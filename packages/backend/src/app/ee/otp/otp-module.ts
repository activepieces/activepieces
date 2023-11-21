import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { otpController } from './otp-controller'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { ApEnvironment } from '@activepieces/shared'

const realOtpModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(otpController, { prefix: '/v1/otp' })
}

const fakeOtpModule: FastifyPluginAsyncTypebox = async (app) => {
    app.log.info('fakeOtpModule')
}

export const otpModule = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT) === ApEnvironment.TESTING
    ? realOtpModule
    : fakeOtpModule
