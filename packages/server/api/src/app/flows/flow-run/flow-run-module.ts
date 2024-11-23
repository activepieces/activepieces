import { logger } from '@activepieces/server-shared'
import { TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { Between } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { telemetry } from '../../helper/telemetry.utils'
import { webhookResponseWatcher } from '../../workers/helper/webhook-response-watcher'
import { flowRunController } from './flow-run-controller'
import { flowRunRepo } from './flow-run-service'


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
