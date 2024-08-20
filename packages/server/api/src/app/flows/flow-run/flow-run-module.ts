import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { flowRunController as controller } from './flow-run-controller'
import { flowRunService } from './flow-run-service'

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(controller, { prefix: '/v1/flow-runs' })
    await webhookResponseWatcher.init()
    systemJobHandlers.registerJobHandler(SystemJobName.LOGS_CLEANUP_TRIGGER, async function flowRunLogsCleanerHandler(): Promise<void> {
        await flowRunService.deleteLogsFilesOlderThanRetentionDate()
    })
    await systemJobsSchedule.upsertJob({
        job: {
            name: SystemJobName.LOGS_CLEANUP_TRIGGER,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0 * */1 * *',
        },
    })
}
