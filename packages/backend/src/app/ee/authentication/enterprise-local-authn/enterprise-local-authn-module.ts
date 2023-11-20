import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { enterpriseLocalAuthnController } from './enterprise-local-authn-controller'
import { ApEnvironment } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'

export const realEnterpriseLocalAuthnModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(enterpriseLocalAuthnController, { prefix: '/v1/authn/local' })
}

const fakeEnterpriseLocalAuthnModule: FastifyPluginAsyncTypebox = async (app) => {
    app.log.info('fakeEnterpriseLocalAuthnModule')
}

export const enterpriseLocalAuthnModule = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT) === ApEnvironment.TESTING
    ? realEnterpriseLocalAuthnModule
    : fakeEnterpriseLocalAuthnModule
