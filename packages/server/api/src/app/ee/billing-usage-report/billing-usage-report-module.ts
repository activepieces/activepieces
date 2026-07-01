import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { billingUsageReportService } from './billing-usage-report-service'

export const billingUsageReportModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.BILLING_USAGE_REPORT, async () => {
        await billingUsageReportService(app.log).reportAllPlatforms()
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.BILLING_USAGE_REPORT,
            data: {},
            jobId: SystemJobName.BILLING_USAGE_REPORT,
        },
        schedule: {
            type: 'repeated',
            cron: '30 15 * * *',
        },
    })
}
