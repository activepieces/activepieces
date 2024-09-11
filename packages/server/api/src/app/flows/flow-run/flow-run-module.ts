import { AppSystemProp, logger, system } from '@activepieces/server-shared'
import { FileType, isNil } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { In, LessThanOrEqual } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { fileRepo } from '../../file/file.service'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { flowRunController as controller } from './flow-run-controller'

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
        const maximumFilesToDeletePerIteration = 4000
        let affected: undefined | number = undefined
        let totalAffected = 0
        while (isNil(affected) || affected === maximumFilesToDeletePerIteration) {
            const logsFileIds = await fileRepo().find({
                select: ['id', 'created'],
                where: {
                    type: FileType.FLOW_RUN_LOG,
                    created: LessThanOrEqual(retentionDateBoundary),
                },
                take: maximumFilesToDeletePerIteration,
            })
            const result = await fileRepo().delete({
                type: FileType.FLOW_RUN_LOG,
                created: LessThanOrEqual(retentionDateBoundary),
                id: In(logsFileIds.map(log => log.id)),
            })
            affected = result.affected || 0
            totalAffected += affected
            logger.info({
                name: SystemJobName.LOGS_CLEANUP_TRIGGER,
                counts: affected,
            }, 'Logs cleanup iteration completed')
        }
        logger.info({
            name: SystemJobName.LOGS_CLEANUP_TRIGGER,
            totalAffected,
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
