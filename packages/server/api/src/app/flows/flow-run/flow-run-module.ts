import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { flowRunController as controller } from './flow-run-controller'
import { AppSystemProp, logger, system } from '@activepieces/server-shared'
import { FileType } from '@activepieces/shared'
import { LessThanOrEqual } from 'typeorm'
import dayjs from 'dayjs'
import { fileRepo } from 'packages/server/api/src/app/file/file.service'

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(controller, { prefix: '/v1/flow-runs' })
    await webhookResponseWatcher.init()
    systemJobHandlers.registerJobHandler(SystemJobName.LOGS_CLEANUP_TRIGGER, async () => {
        logger.info({
            name: SystemJobName.LOGS_CLEANUP_TRIGGER,
        }, 'Logs cleanup started')
        const retentionDateBoundary = dayjs().subtract(EXECUTION_DATA_RETENTION_DAYS, 'days').toISOString()

        const result = await fileRepo().delete({
            type: FileType.FLOW_RUN_LOG,
            created: LessThanOrEqual(retentionDateBoundary),
        })
        logger.info({
            name: SystemJobName.LOGS_CLEANUP_TRIGGER,
            counts: result.affected,
        }, 'Logs cleanup completed')
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
