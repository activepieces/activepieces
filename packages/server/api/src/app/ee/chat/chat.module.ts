import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatController } from './chat-controller'
import { chatHelpers } from './chat-helpers'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.CHAT_STALE_SWEEP, async () => {
        await chatHelpers.recoverAllStaleStreamingConversations({ log: app.log })
    })
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.CHAT_STALE_SWEEP,
            data: {},
            jobId: SystemJobName.CHAT_STALE_SWEEP,
        },
        schedule: {
            type: 'repeated',
            cron: '* * * * *',
        },
    })
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatEnabled))
    await app.register(chatController, { prefix: '/v1/chat' })
}
