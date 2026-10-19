import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { licenseKeyUsageReportService } from './license-key-usage-report-service'

export const licenseKeyUsageReportModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.BILLING_USAGE_REPORT, async () => {
        await licenseKeyUsageReportService(app.log).reportAllPlatforms()
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
