import { TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginAsync } from 'fastify'
import { Between, EntityManager } from 'typeorm'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { telemetry } from '../../helper/telemetry.utils'
import { resumeController } from '../../waitpoints/resume-controller'
import { handleResumeDelayWaitpoint } from '../../waitpoints/resume-delay-handler'
import { waitpointController } from '../../waitpoints/waitpoint-controller'
import { engineResponseWatcher } from '../../workers/engine-response-watcher'
import { flowRunController } from './flow-run-controller'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunRepo } from './flow-run-service'

const RUN_TELEMETRY_STATEMENT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export const flowRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowRunController, { prefix: '/v1/flow-runs' })
    await app.register(resumeController, { prefix: '/v1/flow-runs' })
    await app.register(waitpointController, { prefix: '/v1/waitpoints' })
    systemJobHandlers.registerJobHandler(SystemJobName.RUN_TELEMETRY, async (_job: SystemJobData<SystemJobName.RUN_TELEMETRY>) => {
        if (!telemetry(app.log).isEnabled()) {
            return
        }
        app.log.info({
            name: SystemJobName.RUN_TELEMETRY,
        }, 'Run telemetry started')
        const startOfDay = dayjs().startOf('day').toISOString()
        const endOfDay = dayjs().endOf('day').toISOString()
        const projectFlowCounts = await flowRunRepo().manager.transaction(async (entityManager: EntityManager) => {
            await entityManager.query(`SET LOCAL statement_timeout = ${RUN_TELEMETRY_STATEMENT_TIMEOUT_MS}`)
            return entityManager.createQueryBuilder(FlowRunEntity, 'flowRun')
                .select('"projectId", "flowId", "environment", COUNT(*) as count')
                .where({
                    created: Between(startOfDay, endOfDay),
                })
                .groupBy('"projectId", "flowId", "environment"')
                .getRawMany()
        })
        for (const { projectId, flowId, environment, count } of projectFlowCounts) {
            app.log.info({
                project: { id: projectId },
                flow: { id: flowId },
                environment,
                count: parseInt(count, 10),
            }, 'Tracking flow run created')
            rejectedPromiseHandler(
                telemetry(app.log).trackProject(projectId, {
                    name: TelemetryEventName.FLOW_RUN_CREATED,
                    payload: {
                        projectId,
                        flowId,
                        environment,
                        count: parseInt(count, 10),
                    },
                }),
                app.log,
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
            cron: '50 23 * * *',
        },
    })
    systemJobHandlers.registerJobHandler(SystemJobName.RESUME_DELAY_WAITPOINT, async (data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>) => {
        await handleResumeDelayWaitpoint({ data, log: app.log })
    })
    await engineResponseWatcher(app.log).init()
}
