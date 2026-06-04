import { FileType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { fileService } from './file.service'
import { filesController, signedStepFileController } from './files-controller'

export const fileModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    systemJobHandlers.registerJobHandler(SystemJobName.FILE_CLEANUP_TRIGGER, async () => fileService(app.log).deleteStaleBulk([FileType.FLOW_RUN_LOG, FileType.FLOW_RUN_LOG_SLICE, FileType.FLOW_STEP_FILE, FileType.TRIGGER_EVENT_FILE, FileType.TRIGGER_PAYLOAD, FileType.WEBHOOK_PAYLOAD]))
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.FILE_CLEANUP_TRIGGER,
            data: {},
            jobId: SystemJobName.FILE_CLEANUP_TRIGGER,
        },
        schedule: {
            type: 'repeated',
            cron: '30 */1 * * *',
        },
    })
    await app.register(filesController, { prefix: '/v1/files' })
    await app.register(signedStepFileController, { prefix: '/v1/step-files' })
}
