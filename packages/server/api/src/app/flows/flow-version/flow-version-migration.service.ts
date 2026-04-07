import {
    ActivepiecesError,
    AgentPieceProps,
    AgentProviderModelSchema,
    apId,
    ErrorCode,
    FlowActionType,
    FlowAiProviderMigration,
    FlowAiProviderMigrationStatus,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowVersion,
    FlowVersionState,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    MigrateFlowsModelRequest,
    PlatformId,
    ProjectId,
    sanitizeObjectForPostgresql,
    SeekPage,
    spreadIfDefined,
    tryCatch,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from 'src/app/core/db/repo-factory'
import { transaction } from 'src/app/core/db/transaction'
import { buildPaginator } from 'src/app/helper/pagination/build-paginator'
import { paginationHelper } from 'src/app/helper/pagination/pagination-utils'
import { SystemJobData, SystemJobName } from 'src/app/helper/system-jobs/common'
import { systemJobsSchedule } from 'src/app/helper/system-jobs/system-job'
import { onCallService } from '../../helper/on-call.service'
import { flowExecutionCache } from '../flow/flow-execution-cache'
import { flowRepo } from '../flow/flow.repo'
import { FlowAiProviderMigrationEntity } from './flow-ai-provider-migration.entity'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

const migrationRepo = repoFactory(FlowAiProviderMigrationEntity)

export const flowVersionMigrationService = (log: FastifyBaseLogger) => ({
    async migrate(flowVersion: FlowVersion, projectId?: ProjectId): Promise<FlowVersion> {
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService(log).store(flowVersion)
        }

        const { data: migratedFlowVersion, error: migrationError } = await tryCatch(() => flowMigrations.apply(flowVersion, { log, projectId }))
        if (migrationError) {
            const apError = new ActivepiecesError({
                code: ErrorCode.FLOW_MIGRATION_FAILED,
                params: { flowVersionId: flowVersion.id, message: migrationError.message },
            })
            await onCallService(log).page(apError)
            throw migrationError
        }

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

    async enqueueMigrateFlowsModel({ platformId, userId, request, reqLog }: {
        platformId: PlatformId
        userId: UserId
        request: MigrateFlowsModelRequest
        reqLog: FastifyBaseLogger
    }): Promise<FlowAiProviderMigration> {
        const jobId = `migrate-flow-model-${platformId}`
        const existingJob = await systemJobsSchedule(reqLog).getJob<SystemJobName.MIGRATE_FLOWS_MODEL>(jobId)
        const SKIP_JOB_STATES = ['active', 'delayed', 'waiting']
        if (existingJob && SKIP_JOB_STATES.includes(await existingJob.getState())) {
            throw new ActivepiecesError({
                code: ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS,
                params: { jobId },
            })
        }
        const projectIds = isNil(request.projectIds) || request.projectIds.length === 0 ? null : request.projectIds
        const migrationId = apId()
        const migration = await migrationRepo().save({
            id: migrationId,
            platformId,
            userId,
            status: FlowAiProviderMigrationStatus.RUNNING,
            totalVersions: 0,
            processedVersions: 0,
            failedFlowVersions: [],
            sourceModel: request.sourceModel,
            targetModel: request.targetModel,
            projectIds
        })

        await systemJobsSchedule(reqLog).upsertJob({
            job: {
                name: SystemJobName.MIGRATE_FLOWS_MODEL,
                data: { jobId, migrationId, platformId, userId, request },
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

        return migration
    },

    async migrateFlowsModelHandler(data: SystemJobData<SystemJobName.MIGRATE_FLOWS_MODEL>): Promise<void> {
        const { migrationId, platformId, request: { projectIds, sourceModel, targetModel } } = data
        const BATCH_SIZE = 100
        let offset = 0
        let processedVersions = 0
        const failedFlowVersions: { flowVersionId: string, error: string }[] = []

        const { error: handlerError } = await tryCatch(async () => {
            while (true) {
                const queryBuilder = flowVersionRepo()
                    .createQueryBuilder('fv')
                    .innerJoin('flow', 'f', 'f.id = fv."flowId"')
                    .innerJoin('project', 'p', 'p.id = f."projectId"')
                    .where('p."platformId" = :platformId', { platformId })
                    .andWhere('(fv.id = f."publishedVersionId" OR fv.state = :draftState)',
                        { draftState: FlowVersionState.DRAFT })
                    .orderBy('f.id', 'ASC')

                if (!isNil(projectIds) && projectIds.length > 0) {
                    queryBuilder.andWhere('f."projectId" IN (:...projectIds)', { projectIds })
                }
                queryBuilder.limit(BATCH_SIZE).offset(offset)

                const flowVersions = await queryBuilder.getMany()

                if (flowVersions.length === 0) {
                    break
                }

                for (const flowVersion of flowVersions) {
                    const operations = buildMigrationOperations({ flowVersion, sourceModel, targetModel })

                    if (operations.length === 0) {
                        continue
                    }

                    const { error } = await tryCatch(async () => {
                        await transaction(async (entityManager) => {
                            let updatedVersion: FlowVersion = flowVersion
                            for (const operation of operations) {
                                updatedVersion = flowOperations.apply(updatedVersion, operation)
                            }
                            const isDraft = flowVersion.state === FlowVersionState.DRAFT
                            const newVersion = sanitizeObjectForPostgresql({
                                ...updatedVersion,
                                id: apId(),
                                state: isDraft ? FlowVersionState.DRAFT : FlowVersionState.LOCKED,
                                created: dayjs().toISOString(),
                                updated: dayjs().toISOString(),
                            })
                            await flowVersionRepo(entityManager).save(newVersion)
                            if (!isDraft) {
                                await flowRepo(entityManager).update(newVersion.flowId, { publishedVersionId: newVersion.id })
                            }
                            await flowExecutionCache(log).invalidate(newVersion.flowId)
                        })
                        processedVersions++
                    })

                    if (error) {
                        log.error({ flowVersionId: flowVersion.id, error }, 'Failed to migrate flow version')
                        failedFlowVersions.push({ flowVersionId: flowVersion.id, flowId: flowVersion.flowId, error: error.message })
                    }
                }

                await migrationRepo().update(migrationId, {
                    processedVersions,
                    failedFlowVersions,
                })

                offset += flowVersions.length
            }
        })

        if (handlerError) {
            log.error({ migrationId, error: handlerError }, 'Flow model migration failed unexpectedly')
            await migrationRepo().update(migrationId, {
                status: FlowAiProviderMigrationStatus.FAILED,
                processedVersions,
                failedFlowVersions,
            })
            return
        }

        await migrationRepo().update(migrationId, {
            status: FlowAiProviderMigrationStatus.COMPLETED,
            processedVersions,
            failedFlowVersions,
        })
        log.info({ platformId, processedVersions, failedCount: failedFlowVersions.length }, 'Flow model migration completed')
    },

    async getMigration({ id, platformId }: { id: string, platformId: PlatformId }): Promise<FlowAiProviderMigration> {
        const migration = await migrationRepo().findOneBy({ id, platformId })
        if (isNil(migration)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'FlowAiProviderMigration', entityId: id },
            })
        }
        return migration
    },

    async listMigrations({ platformId, limit, cursor }: {
        platformId: PlatformId
        limit: number
        cursor: string | null
    }): Promise<SeekPage<FlowAiProviderMigration>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: FlowAiProviderMigrationEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = migrationRepo()
            .createQueryBuilder('flow_ai_provider_migration')
            .where({ platformId })
        const { data, cursor: pageCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<FlowAiProviderMigration>(data, pageCursor)
    },
})

function buildMigrationOperations({ flowVersion, sourceModel, targetModel }: {
    flowVersion: FlowVersion
    sourceModel: AgentProviderModelSchema
    targetModel: AgentProviderModelSchema
}): FlowOperationRequest[] {
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const operations: FlowOperationRequest[] = []

    for (const step of allSteps) {
        if (!flowStructureUtil.isAgentPiece(step) || step.type !== FlowActionType.PIECE) {
            continue
        }
        const input = step.settings?.input as Record<string, unknown> | undefined
        let model = input?.model as string | undefined
        let provider = input?.provider as string | undefined

        if (step.settings.actionName === 'run_agent') {
            const runAgentObject = input?.[AgentPieceProps.AI_PROVIDER_MODEL] as AgentProviderModelSchema | undefined
            model = runAgentObject?.model
            provider = runAgentObject?.provider
        }

        if (provider !== sourceModel.provider || model !== sourceModel.model) {
            continue
        }

        const updatedInput = { ...input }
        if (step.settings.actionName === 'run_agent') {
            updatedInput[AgentPieceProps.AI_PROVIDER_MODEL] = targetModel
        }
        else {
            updatedInput['model'] = targetModel.model
            updatedInput['provider'] = targetModel.provider
        }

        const { sampleData: _sampleData, ...settingsWithoutSampleData } = step.settings
        operations.push({
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                ...step,
                settings: {
                    ...settingsWithoutSampleData,
                    input: updatedInput,
                },
            },
        })
    }

    return operations
}
