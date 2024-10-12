import { AppSystemProp, logger, system } from '@activepieces/server-shared'
import { FileType, isNil, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { Between, In, LessThanOrEqual } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { fileRepo } from '../../file/file.service'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { telemetry } from '../../helper/telemetry.utils'
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { flowRunController } from './flow-run-controller'
import { flowRunRepo } from './flow-run-service'

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowRunController, { prefix: '/v1/flow-runs' })
    systemJobHandlers.registerJobHandler(SystemJobName.RUN_TELEMETRY, runTelemetryHandler)
    await systemJobsSchedule.upsertJob({
        job: {
            name: SystemJobName.RUN_TELEMETRY,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/50 23 * * *',
        },
    })
    await webhookResponseWatcher.init()
    systemJobHandlers.registerJobHandler(SystemJobName.LOGS_CLEANUP_TRIGGER, logsCleanupHandler)
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
async function runTelemetryHandler(_job: SystemJobData<SystemJobName.RUN_TELEMETRY>) {
    if (!telemetry.isEnabled()) {
        return
    }
    logger.info({
        name: SystemJobName.RUN_TELEMETRY,
    }, 'Run telemetry started')
    const startOfDay = dayjs().startOf('day').toISOString()
    const endOfDay = dayjs().endOf('day').toISOString()
    const projectFlowCounts = await flowRunRepo().createQueryBuilder('flowRun')
        .select('"projectId", "flowId", "environment", COUNT(*) as count')
        .where({
            created: Between(startOfDay, endOfDay),
        })
        .groupBy('"projectId", "flowId", "environment"')
        .getRawMany()
    for (const { projectId, flowId, environment, count } of projectFlowCounts) {
        logger.info({
            projectId,
            flowId,
            environment,
            count: parseInt(count, 10),
        }, 'Tracking flow run created')
        telemetry
            .trackProject(projectId, {
                name: TelemetryEventName.FLOW_RUN_CREATED,
                payload: {
                    projectId,
                    flowId,
                    environment,
                    count: parseInt(count, 10),
                },
            })
            .catch((e) =>
                logger.error(e, '[FlowRunService#Start] telemetry.trackProject'),
            )
    }
}

async function logsCleanupHandler() {
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
}
