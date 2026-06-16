import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { flowRunTrackingService } from './flow-run-tracking-service'

export const flowRunTrackingModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.FLOW_RUN_TRACKING, async () => {
        await flowRunTrackingService(app.log).reportAllPlatforms()
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.FLOW_RUN_TRACKING,
            data: {},
            jobId: SystemJobName.FLOW_RUN_TRACKING,
        },
        schedule: {
            type: 'repeated',
            cron: '30 15 * * *',
        },
    })
}
