import { ApEdition } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { system } from '../../helper/system/system'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { TRIAL_SEAT_GRACE_SWEEP_CRON, TRIAL_SEAT_GRACE_SWEEP_RETRY, trialSeatGrace } from '../platform/platform-plan/trial-seat-grace'
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

    if (system.getEdition() === ApEdition.COMMUNITY) {
        return
    }

    systemJobHandlers.registerJobHandler(SystemJobName.TRIAL_SEAT_GRACE_SWEEP, async () => {
        await trialSeatGrace(app.log).sweep()
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.TRIAL_SEAT_GRACE_SWEEP,
            data: {},
            jobId: SystemJobName.TRIAL_SEAT_GRACE_SWEEP,
        },
        schedule: {
            type: 'repeated',
            cron: TRIAL_SEAT_GRACE_SWEEP_CRON,
        },
        customConfig: TRIAL_SEAT_GRACE_SWEEP_RETRY,
    })
}
