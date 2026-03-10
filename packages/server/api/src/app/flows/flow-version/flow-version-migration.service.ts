import {
    ActivepiecesError,
    AgentPieceProps,
    AgentProviderModelSchema,
    apId,
    ErrorCode,
    flowStructureUtil,
    FlowVersion,
    FlowVersionState,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    MigrateFlowsModelRequest,
    PlatformId,
    sanitizeObjectForPostgresql,
    spreadIfDefined,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { flowExecutionCache } from '../flow/flow-execution-cache'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

export const flowVersionMigrationService = (log: FastifyBaseLogger) => ({
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService(log).store(flowVersion)
        }

        const migratedFlowVersion: FlowVersion = await flowMigrations.apply(flowVersion)

        await flowVersionRepo().update(flowVersion.id, {
            schemaVersion: migratedFlowVersion.schemaVersion,
            ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFiles,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },

    async enqueueMigrateFlowsModel(platformId: PlatformId, request: MigrateFlowsModelRequest, reqLog: FastifyBaseLogger): Promise<void> {
        const jobId = `migrate-flow-model-${platformId}`
        const existingJob = await systemJobsSchedule(reqLog).getJob<SystemJobName.MIGRATE_FLOWS_MODEL>(jobId)
        const SKIP_JOB_STATES = ['active', 'delayed', 'waiting']
        if (existingJob && SKIP_JOB_STATES.includes(await existingJob.getState())) {
            throw new ActivepiecesError({
                code: ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS,
                params: { jobId },
            })
        }
        await systemJobsSchedule(reqLog).upsertJob({
            job: {
                name: SystemJobName.MIGRATE_FLOWS_MODEL,
                data: { jobId, platformId, request },
                jobId,
            },
            schedule: {
                type: 'one-time',
                date: dayjs(),
            },
            customConfig: {
                removeOnComplete: true,
                removeOnFail: true,
            },
        })
    },

    async migrateFlowsModelHandler(data: SystemJobData<SystemJobName.MIGRATE_FLOWS_MODEL>): Promise<void> {
        const { jobId, platformId, request: { projectIds, sourceModel, targetModel } } = data
        const BATCH_SIZE = 100
        let offset = 0
        let updatedFlows = 0

        while (true) {
            const queryBuilder = flowVersionRepo()
                .createQueryBuilder('fv')
                .innerJoin('flow', 'f', 'f.id = fv."flowId"')
                .innerJoin('project', 'p', 'p.id = f."projectId"')
                .where('p."platformId" = :platformId', { platformId })
                .andWhere(`fv.id = (
                    SELECT fv2.id FROM flow_version fv2
                    WHERE fv2."flowId" = f.id
                    ORDER BY fv2.created DESC LIMIT 1
                )`)
                .orderBy('f.id', 'ASC')

            if (!isNil(projectIds) && projectIds.length > 0) {
                queryBuilder.andWhere('f."projectId" IN (:...projectIds)', { projectIds })
            }
            queryBuilder.limit(BATCH_SIZE).offset(offset)

            const flowVersions = await queryBuilder.getMany()

            if (flowVersions.length === 0) {
                break
            }

            await Promise.all(flowVersions.map(async (flowVersion) => {
                let hasChanges = false

                const updatedVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
                    if (!flowStructureUtil.isAgentPiece(step)) {
                        return step
                    }
                    const input = step.settings?.input as Record<string, unknown> | undefined
                    let model = input?.model as string | undefined
                    let provider = input?.provider as string | undefined

                    if (step.settings.actionName === 'run_agent') {
                        const runAgentObject = input?.[AgentPieceProps.AI_PROVIDER_MODEL] as AgentProviderModelSchema | undefined
                        model = runAgentObject?.model
                        provider = runAgentObject?.provider
                    }

                    if (provider === sourceModel.provider && model === sourceModel.model) {
                        hasChanges = true
                        const clonedStep = JSON.parse(JSON.stringify(step))
                        clonedStep.settings.input['model'] = targetModel.model
                        clonedStep.settings.input['provider'] = targetModel.provider
                        if (step.settings.actionName === 'run_agent') {
                            clonedStep.settings.input[AgentPieceProps.AI_PROVIDER_MODEL] = targetModel
                        }
                        return clonedStep
                    }
                    return step
                })

                if (hasChanges) {
                    const newVersion = sanitizeObjectForPostgresql({
                        ...updatedVersion,
                        id: apId(),
                        state: FlowVersionState.LOCKED,
                        created: dayjs().toISOString(),
                        updated: dayjs().toISOString(),
                    })
                    await flowVersionRepo().save(newVersion)
                    await flowRepo().update(newVersion.flowId, { publishedVersionId: newVersion.id })
                    await flowExecutionCache(log).invalidate(newVersion.flowId)
                    updatedFlows++
                }
            }))

            offset += flowVersions.length
        }

        log.info({ platformId, updatedFlows }, 'Flow model migration completed')

        const job = await systemJobsSchedule(log).getJob<SystemJobName.MIGRATE_FLOWS_MODEL>(jobId)
        if (job) {
            await job.updateData({ ...data, updatedFlows })
        }
    },
})
