import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobHandlers } from '../../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { platformPlanController } from './platform-plan.controller'
import { platformPlanService } from './platform-plan.service'
import { stripeBillingController } from './stripe-billing.controller'

export const platformPlanModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.AUTUMN_REFRESH, () => platformPlanService(app.log).refreshEnrolledPlatforms())
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.AUTUMN_REFRESH,
            data: {},
            jobId: SystemJobName.AUTUMN_REFRESH,
        },
        schedule: {
            type: 'repeated',
            cron: '0 2 * * *',
        },
    })

    await app.register(platformPlanController, { prefix: '/v1/platform-billing' })
    await app.register(stripeBillingController, { prefix: '/v1/stripe-billing' })
}
