import { onCallService } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    AgentPieceProps,
    AgentProviderModelSchema,
    apId,
    ErrorCode,
    FlowActionType,
    FlowMigration,
    FlowMigrationStatus,
    FlowMigrationType,
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
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { flowExecutionCache } from '../flow/flow-execution-cache'
import { flowRepo } from '../flow/flow.repo'
import { FlowMigrationEntity } from './flow-migration.entity'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

const migrationRepo = repoFactory(FlowMigrationEntity)

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
            onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
                code: ErrorCode.FLOW_MIGRATION_FAILED,
                message: migrationError.message,
                params: { flowVersionId: flowVersion.id },
            }).catch((pageError) => {
                log.error({ pageError }, '[flowVersionMigration] Failed to send on-call page')
            })
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
    }): Promise<FlowMigration> {
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
            type: FlowMigrationType.AI_PROVIDER_MODEL,
            status: FlowMigrationStatus.RUNNING,
            migratedVersions: [],
            failedFlowVersions: [],
            params: {
                sourceModel: request.sourceModel,
                targetModel: request.targetModel,
                projectIds,
            },
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
        const migratedVersions: FlowMigration['migratedVersions'] = []
        const failedFlowVersions: FlowMigration['failedFlowVersions'] = []
        const { error: handlerError } = await tryCatch(async () => {
            const idsQueryBuilder = flowVersionRepo()
                .createQueryBuilder('fv')
                .select('fv.id')
                .innerJoin('flow', 'f', 'f.id = fv."flowId"')
                .innerJoin('project', 'p', 'p.id = f."projectId"')
                .where('p."platformId" = :platformId', { platformId })
                .andWhere('(fv.id = f."publishedVersionId" OR fv.state = :draftState)',
                    { draftState: FlowVersionState.DRAFT })

            if (!isNil(projectIds) && projectIds.length > 0) {
                idsQueryBuilder.andWhere('f."projectId" IN (:...projectIds)', { projectIds })
            }

            const allIds = (await idsQueryBuilder.orderBy('fv.state', 'DESC').getMany()).map((fv) => fv.id)

            for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
                const batchIds = allIds.slice(i, i + BATCH_SIZE)
                const flowVersions = await flowVersionRepo()
                    .createQueryBuilder('fv')
                    .where('fv.id IN (:...batchIds)', { batchIds })
                    .orderBy('fv.state', 'DESC')
                    .getMany()

                for (const flowVersion of flowVersions) {
                    const operations = buildMigrationOperations({ flowVersion, sourceModel, targetModel })

                    if (operations.length === 0) {
                        continue
                    }
                    const isDraft = flowVersion.state === FlowVersionState.DRAFT
                    const { error } = await tryCatch(async () => {
                        await transaction(async (entityManager) => {
                            let updatedVersion: FlowVersion = flowVersion
                            for (const operation of operations) {
                                updatedVersion = flowOperations.apply(updatedVersion, operation)
                            }
                            const newVersion = sanitizeObjectForPostgresql({
                                ...updatedVersion,
                                id: apId(),
                                state: isDraft ? FlowVersionState.DRAFT : FlowVersionState.LOCKED,
                                created: dayjs().toISOString(),
                                updated: dayjs().toISOString(),
                            })
                            await flowVersionRepo(entityManager).save(newVersion)
                            if (isDraft) {
                                await flowVersionRepo(entityManager).update(flowVersion.id, { state: FlowVersionState.LOCKED })
                            }
                            else {
                                await flowRepo(entityManager).update(newVersion.flowId, { publishedVersionId: newVersion.id })
                            }
                        })
                        await flowExecutionCache(log).invalidate(flowVersion.flowId)
                        migratedVersions.push({ draft: isDraft, flowVersionId: flowVersion.id, flowId: flowVersion.flowId })
                    })

                    if (error) {
                        log.error({ flowVersionId: flowVersion.id, error }, 'Failed to migrate flow version')
                        failedFlowVersions.push({ draft: isDraft, flowVersionId: flowVersion.id, flowId: flowVersion.flowId, error: error.message })
                    }
                }

                await migrationRepo().update(migrationId, {
                    migratedVersions,
                    failedFlowVersions,
                })
            }
        })

        if (handlerError) {
            log.error({ migrationId, error: handlerError }, 'Flow model migration failed unexpectedly')
            await migrationRepo().update(migrationId, {
                status: FlowMigrationStatus.FAILED,
                migratedVersions,
                failedFlowVersions,
            })
            return
        }

        await migrationRepo().update(migrationId, {
            status: FlowMigrationStatus.COMPLETED,
            migratedVersions,
            failedFlowVersions,
        })
        log.info({ platformId, migratedFlows: new Set(migratedVersions.map((v) => v.flowId)).size, failedCount: failedFlowVersions.length }, 'Flow model migration completed')
    },

    async getMigration({ id, platformId }: { id: string, platformId: PlatformId }): Promise<FlowMigration> {
        const migration = await migrationRepo().findOneBy({ id, platformId })
        if (isNil(migration)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'FlowMigration', entityId: id },
            })
        }
        return migration
    },

    async listMigrations({ platformId, limit, cursor }: {
        platformId: PlatformId
        limit: number
        cursor: string | null
    }): Promise<SeekPage<FlowMigration>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: FlowMigrationEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = migrationRepo()
            .createQueryBuilder('flow_migration')
            .where({ platformId })
        const { data, cursor: pageCursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<FlowMigration>(data, pageCursor)
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

    if (operations.length > 0) {
        const lastStepName = findLastStepInMainChain(flowVersion)
        const existingNames = allSteps.map((s) => s.name)
        const uniqueName = flowStructureUtil.findUnusedName(existingNames)
        operations.push({
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: lastStepName,
                action: {
                    name: uniqueName,
                    displayName: 'Code',
                    valid: true,
                    skip: false,
                    type: FlowActionType.CODE,
                    settings: {
                        sourceCode: {
                            code: 'export const code = async (inputs) => {\n  return 123;\n};',
                            packageJson: '{}',
                        },
                        input: {},
                        errorHandlingOptions: {
                            continueOnFailure: {
                                value: false,
                            },
                            retryOnFailure: {
                                value: false,
                            },
                        },
                    },
                },
            },
        })
    }

    return operations
}

function findLastStepInMainChain(flowVersion: FlowVersion): string {
    let current: { name: string, nextAction?: unknown } = flowVersion.trigger
    while (current.nextAction) {
        current = current.nextAction as { name: string, nextAction?: unknown }
    }
    return current.name
}
