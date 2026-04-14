import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { consoleUsageController } from './console-usage-controller'
import { consoleUsageService } from './console-usage-service'

export const consoleUsageModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(consoleUsageController, { prefix: '/v1/console-usage' })

    systemJobHandlers.registerJobHandler(SystemJobName.CONSOLE_USAGE_REPORT, async () => {
        await consoleUsageService(app.log).reportAllPlatforms()
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.CONSOLE_USAGE_REPORT,
            data: {},
            jobId: SystemJobName.CONSOLE_USAGE_REPORT,
        },
        schedule: {
            type: 'repeated',
            cron: '0 */6 * * *',
        },
    })
}
