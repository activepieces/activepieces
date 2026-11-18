import { FastifyBaseLogger } from 'fastify'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { aiUsageCopy } from './ai-usage-copy'
import { aiUsageRetention } from './ai-usage-retention'

export const aiUsageJobs = {
    async register(log: FastifyBaseLogger): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.AI_USAGE_COPY, () => aiUsageCopy(log).run())
        await systemJobsSchedule(log).upsertJob({
            job: { name: SystemJobName.AI_USAGE_COPY, data: {}, jobId: SystemJobName.AI_USAGE_COPY },
            schedule: { type: 'repeated', cron: EVERY_MINUTE },
            customConfig: ONE_ATTEMPT,
        })
        systemJobHandlers.registerJobHandler(SystemJobName.AI_USAGE_RETENTION, () => aiUsageRetention.run())
        await systemJobsSchedule(log).upsertJob({
            job: { name: SystemJobName.AI_USAGE_RETENTION, data: {}, jobId: SystemJobName.AI_USAGE_RETENTION },
            schedule: { type: 'repeated', cron: HOURLY_AT_TWENTY },
            customConfig: ONE_ATTEMPT,
        })
    },
}

const EVERY_MINUTE = '* * * * *'
const HOURLY_AT_TWENTY = '20 * * * *'
const ONE_ATTEMPT = { attempts: 1, removeOnComplete: true, removeOnFail: true }
