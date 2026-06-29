import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { chatFunnelSync } from './chat-funnel-sync'

export const chatFunnelTrackingModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.CHAT_FUNNEL_SYNC, async () => {
        await chatFunnelSync(app.log).pushSnapshot()
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.CHAT_FUNNEL_SYNC,
            data: {},
            jobId: SystemJobName.CHAT_FUNNEL_SYNC,
        },
        schedule: {
            type: 'repeated',
            cron: '*/30 * * * *',
        },
    })
}
