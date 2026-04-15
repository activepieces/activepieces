import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { platformCopilotIndexer } from './platform-copilot-indexer'
import { platformCopilotController } from './platform-copilot.controller'

export const platformCopilotModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformCopilotController, { prefix: '/v1/platform-copilot' })

    systemJobHandlers.registerJobHandler(SystemJobName.COPILOT_INDEX_REFRESH, async () => {
        try {
            await platformCopilotIndexer(app.log).reindex()
            app.log.info('[COPILOT_INDEX_REFRESH] indexing complete')
        }
        catch (err) {
            app.log.error({ err }, '[COPILOT_INDEX_REFRESH] indexing failed')
        }
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.COPILOT_INDEX_REFRESH,
            data: {},
            jobId: SystemJobName.COPILOT_INDEX_REFRESH,
        },
        schedule: {
            type: 'repeated',
            cron: '0 3 * * 0',
        },
    })
}
