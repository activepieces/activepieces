import { FlowRunStatus, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { Between } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { telemetry } from '../../helper/telemetry.utils'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowRunController } from './flow-run-controller'
import { flowRunRepo, flowRunService } from './flow-run-service'
import { flowRunLogsController } from './logs/flow-run-logs-controller'
import { resumeController } from './waitpoint/resume-controller'
import { resumeService } from './waitpoint/resume-service'
import { waitpointController } from './waitpoint/waitpoint-controller'


export const flowRunModule: FastifyPluginAsync = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, async (data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>) => {
        const flowRun = await flowRunService(app.log).getOneOrThrow({ id: data.flowRunId, projectId: data.projectId })
        if (flowRun.status !== FlowRunStatus.PAUSED) {
            app.log.info({ flowRunId: data.flowRunId, waitpointId: data.waitpointId, status: flowRun.status },
                '[RESUME_DELAY_WAITPOINT] Flow not PAUSED, skipping')
            return
        }
        app.log.info({ flowRunId: data.flowRunId, waitpointId: data.waitpointId },
            '[RESUME_DELAY_WAITPOINT] Resuming flow')
        await resumeService(app.log).resumeFromWaitpoint({
            flowRunId: data.flowRunId,
            waitpointId: data.waitpointId,
            resumePayload: null,
        })
    })
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
            jobId: SystemJobName.RUN_TELEMETRY,
        },
        schedule: {
            type: 'repeated',
            cron: '0/50 23 * * *',
        },
    })
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowRunController, { prefix: '/v1/flow-runs' })
    await app.register(resumeController, { prefix: '/v1/flow-runs' })
    await app.register(flowRunLogsController, { prefix: '/v1/flow-runs' })
    await app.register(waitpointController, { prefix: '/v1/waitpoints' })
    await engineResponseWatcher(app.log).init()
}
