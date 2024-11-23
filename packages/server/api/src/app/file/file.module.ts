import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { FileType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { systemJobsSchedule } from '../helper/system-jobs'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { fileService } from './file.service'
import { stepFileMigration } from './step-file/step-file-migration'
import { stepFileController } from './step-file/step-file.controller'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    rejectedPromiseHandler(stepFileMigration.migrate())
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    systemJobHandlers.registerJobHandler(SystemJobName.FILE_CLEANUP_TRIGGER, async () => fileService.deleteStaleBulk([FileType.FLOW_RUN_LOG, FileType.TRIGGER_EVENT_FILE]))
    await systemJobsSchedule.upsertJob({
        job: {
            name: SystemJobName.FILE_CLEANUP_TRIGGER,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0 */4 * * *',
        },
    })
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}
