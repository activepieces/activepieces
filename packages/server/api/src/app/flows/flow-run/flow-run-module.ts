import { TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { Between } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { telemetry } from '../../helper/telemetry.utils'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowRunController } from './flow-run-controller'
import { flowRunRepo } from './flow-run-service'


export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowRunController, { prefix: '/v1/flow-runs' })
    systemJobHandlers.registerJobHandler(SystemJobName.RUN_TELEMETRY, async (_job: SystemJobData<SystemJobName.RUN_TELEMETRY>) => {
        if (!telemetry(app.log).isEnabled()) {
            return
        }
        app.log.info({
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
            app.log.info({
                projectId,
                flowId,
                environment,
                count: parseInt(count, 10),
            }, 'Tracking flow run created')
            telemetry(app.log)
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
                    app.log.error(e, '[FlowRunService#Start] telemetry.trackProject'),
                )
        }
    })
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.RUN_TELEMETRY,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0/50 23 * * *',
        },
    })
    await engineResponseWatcher(app.log).init()
}
