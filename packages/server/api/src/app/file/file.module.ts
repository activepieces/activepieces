import { FileType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { fileService } from './file.service'
import { stepFileController } from './step-file/step-file.controller'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    systemJobHandlers.registerJobHandler(SystemJobName.FILE_CLEANUP_TRIGGER, async () => fileService(app.log).deleteStaleBulk([FileType.FLOW_RUN_LOG, FileType.TRIGGER_EVENT_FILE, FileType.TRIGGER_PAYLOAD]))
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.FILE_CLEANUP_TRIGGER,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '30 */1 * * *',
        },
    })
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}
