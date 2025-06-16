import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { system } from '../../helper/system/system'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { issuesController } from './issues-controller'
import { issuesService } from './issues-service'

export const issuesModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(issuesController, { prefix: '/v1/issues' })

    const archiveDays = parseInt(system.getOrThrow(AppSystemProp.ISSUE_ARCHIVE_DAYS))
    systemJobHandlers.registerJobHandler(SystemJobName.ISSUE_AUTO_ARCHIVE, async (_job: SystemJobData<SystemJobName.ISSUE_AUTO_ARCHIVE>) => {
        await issuesService(app.log).archiveOldIssues(archiveDays)
    })

    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.ISSUE_AUTO_ARCHIVE,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0 0 * * *',
        },
    })

    app.log.info('Archive job registered')
}
