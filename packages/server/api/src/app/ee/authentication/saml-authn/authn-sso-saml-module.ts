import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { authnSsoSamlController } from './authn-sso-saml-controller'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.EXPIRE_PENDING_SSO_DOMAINS, async () => authnSsoSamlService(app.log).expirePendingSsoDomains())
    systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.EXPIRE_PENDING_SSO_DOMAINS,
            data: {},
            jobId: SystemJobName.EXPIRE_PENDING_SSO_DOMAINS,
        },
        schedule: {
            type: 'repeated',
            cron: '0 * * * *',
        },
    })
    await app.register(authnSsoSamlController, { prefix: '/v1/authn/saml' })
}
