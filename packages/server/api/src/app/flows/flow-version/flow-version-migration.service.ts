import { onCallService } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    AiProviderModelMigrationRequest,
    apId,
    ErrorCode,
    FailedFlowVersionEntry,
    FlowMigration,
    FlowMigrationStatus,
    FlowMigrationType,
    flowOperations,
    FlowVersion,
    FlowVersionState,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    MigratedVersionEntry,
    MigrateFlowsModelRequest,
    PieceVersionChange,
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
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { flowExecutionCache } from '../flow/flow-execution-cache'
import { flowRepo } from '../flow/flow.repo'
import { planFlowVersionChanges, PlannedStepChange } from './ai-migration-planner'
import { dynamicSchemaResolver } from './dynamic-schema-resolver'
import { FlowMigrationEntity } from './flow-migration.entity'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

const migrationRepo = repoFactory(FlowMigrationEntity)

export const flowVersionMigrationService = (log: FastifyBaseLogger) => ({
    async migrate(flowVersion: FlowVersion, projectId?: ProjectId, options?: { noPersistence?: boolean }): Promise<FlowVersion> {
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const noPersistence = options?.noPersistence === true
        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion) && !noPersistence) {
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

        if (!noPersistence) {
            await flowVersionRepo().update(flowVersion.id, {
                schemaVersion: migratedFlowVersion.schemaVersion,
                ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
                connectionIds: migratedFlowVersion.connectionIds,
                agentIds: migratedFlowVersion.agentIds,
                backupFiles,
            })
        }
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },

    async enqueueMigration({ platformId, userId, request, reqLog }: {
        platformId: PlatformId
        userId: UserId
        request: MigrateFlowsModelRequest
        reqLog: FastifyBaseLogger
    }): Promise<FlowMigration> {
        await assertNoActiveMigrationJob({ jobId: `migrate-flow-model-${platformId}`, reqLog })
        switch (request.type) {
            case FlowMigrationType.AI_PROVIDER_MODEL_REVERT:
                return enqueueAiProviderModelRevert({
                    platformId,
                    userId,
                    revertOfMigrationId: request.revertOfMigrationId,
                    reqLog,
                })
            case FlowMigrationType.AI_PROVIDER_MODEL:
                await assertModelTypeMatches({ log: reqLog, platformId, request })
                return enqueueAiProviderModelMigration({
                    platformId,
                    userId,
                    request,
                    reqLog,
                })
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'Invalid migration type' },
                })
        }
    },

    async migrateFlowsModelHandler(data: SystemJobData<SystemJobName.MIGRATE_FLOWS_MODEL>): Promise<void> {
        if (data.request.type === FlowMigrationType.AI_PROVIDER_MODEL_REVERT) {
            await flowVersionMigrationService(log).revertMigrationHandler(data)
            return
        }
        const { migrationId, platformId, request } = data
        const { projectIds, sourceModel, targetModel, aiProviderModelType, dryCheck } = request
        const BATCH_SIZE = 100
        const migratedVersions: MigratedVersionEntry[] = []
        const failedFlowVersions: FailedFlowVersionEntry[] = []

        const cache = dynamicSchemaResolver.createCache()

        const { error: handlerError } = await tryCatch(async () => {
            const targetRows = await flowVersionRepo()
                .createQueryBuilder('fv')
                .select('fv.id', 'flow_version_id')
                .addSelect('f."projectId"', 'project_id')
                .innerJoin('flow', 'f', 'f.id = fv."flowId"')
                .innerJoin('project', 'p', 'p.id = f."projectId"')
                .where('p."platformId" = :platformId', { platformId })
                .andWhere('(fv.id = f."publishedVersionId" OR fv.state = :draftState)',
                    { draftState: FlowVersionState.DRAFT })
                .andWhere('f."projectId" IN (:...projectIds)', { projectIds })
                .orderBy('fv.state', 'DESC')
                .addOrderBy('fv.id', 'ASC')
                .getRawMany<{ flow_version_id: string, project_id: string }>()

            const projectIdByFlowVersionId = new Map(targetRows.map((r) => [r.flow_version_id, r.project_id]))
            const allIds = targetRows.map((r) => r.flow_version_id)

            for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
                const batchIds = allIds.slice(i, i + BATCH_SIZE)
                const flowVersions = await flowVersionRepo()
                    .createQueryBuilder('fv')
                    .where('fv.id IN (:...batchIds)', { batchIds })
                    .orderBy('fv.state', 'DESC')
                    .getMany()

                for (const flowVersion of flowVersions) {
                    const projectId = projectIdByFlowVersionId.get(flowVersion.id)
                    if (isNil(projectId)) {
                        continue
                    }
                    const isDraft = flowVersion.state === FlowVersionState.DRAFT

                    const { data: migratedFv, error: schemaErr } = await tryCatch(() =>
                        flowVersionMigrationService(log).migrate(flowVersion, projectId, dryCheck ? { noPersistence: true } : undefined),
                    )
                    if (schemaErr) {
                        log.error({ flowVersionId: flowVersion.id, error: schemaErr }, 'Schema-chain migration failed during AI provider migration')
                        failedFlowVersions.push({
                            draft: isDraft,
                            flowVersionId: flowVersion.id,
                            flowId: flowVersion.flowId,
                            projectId,
                            error: schemaErr.message,
                        })
                        continue
                    }

                    const changes = await planFlowVersionChanges({
                        flowVersion: migratedFv,
                        sourceModel,
                        targetModel,
                        aiProviderModelType,
                        platformId,
                        projectId,
                        cache,
                        log,
                    })

                    const blockedChanges = changes.filter((c): c is Extract<PlannedStepChange, { error: string }> => 'error' in c && !isNil(c.error))
                    const applicableChanges = changes.filter((c): c is Extract<PlannedStepChange, { operation: unknown }> => 'operation' in c && !isNil(c.operation))

                    if (blockedChanges.length > 0) {
                        failedFlowVersions.push({
                            draft: isDraft,
                            flowVersionId: flowVersion.id,
                            flowId: flowVersion.flowId,
                            projectId,
                            error: blockedChanges.map((c) => c.error).join('\n'),
                        })
                        continue
                    }

                    if (applicableChanges.length === 0) {
                        continue
                    }

                    const pieceVersionChanges = dedupePieceVersionChanges(applicableChanges.map((c) => ({
                        from: c.diff.pieceVersionFrom,
                        to: c.diff.pieceVersionTo,
                    })))
                    const changedFields: NonNullable<MigratedVersionEntry['changedFields']> = {}
                    for (const change of applicableChanges) {
                        if (change.diff.clearedAdvancedOptions) changedFields.clearedAdvancedOptions = true
                        if (change.diff.disabledWebSearch) changedFields.disabledWebSearch = true
                    }

                    const newFlowVersionId = apId()

                    const { error: applyError } = await tryCatch(async () => {
                        if (dryCheck) {
                            return
                        }
                        await transaction(async (entityManager) => {
                            let updatedVersion: FlowVersion = migratedFv
                            for (const change of applicableChanges) {
                                updatedVersion = flowOperations.apply(updatedVersion, change.operation)
                            }
                            const newVersion = sanitizeObjectForPostgresql({
                                ...updatedVersion,
                                id: newFlowVersionId,
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
                    })

                    if (applyError) {
                        log.error({ flowVersionId: flowVersion.id, error: applyError }, 'Failed to migrate flow version')
                        failedFlowVersions.push({
                            draft: isDraft,
                            flowVersionId: flowVersion.id,
                            flowId: flowVersion.flowId,
                            projectId,
                            error: applyError.message,
                        })
                        continue
                    }

                    migratedVersions.push({
                        draft: isDraft,
                        flowVersionId: flowVersion.id,
                        flowId: flowVersion.flowId,
                        projectId,
                        newFlowVersionId,
                        ...(pieceVersionChanges.length > 0 ? { pieceVersionChanges } : {}),
                        ...(Object.keys(changedFields).length > 0 ? { changedFields } : {}),
                    })
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
        log.info({ platformId, dryCheck, migratedFlows: new Set(migratedVersions.map((v) => v.flowId)).size, failedCount: failedFlowVersions.length }, 'Flow model migration completed')
    },

    async revertMigrationHandler(data: SystemJobData<SystemJobName.MIGRATE_FLOWS_MODEL>): Promise<void> {
        const { migrationId, platformId, request } = data
        if (request.type !== FlowMigrationType.AI_PROVIDER_MODEL_REVERT) {
            return
        }
        const migratedVersions: MigratedVersionEntry[] = []
        const failedFlowVersions: FailedFlowVersionEntry[] = []

        const { error: handlerError } = await tryCatch(async () => {
            const original = await migrationRepo().findOneBy({ id: request.revertOfMigrationId, platformId })
            if (isNil(original) || original.type !== FlowMigrationType.AI_PROVIDER_MODEL) {
                throw new Error('Original migration not found or not an AI provider model migration')
            }

            for (const entry of original.migratedVersions) {
                const flow = await flowRepo().findOneBy({ id: entry.flowId, projectId: entry.projectId })
                if (isNil(flow)) {
                    failedFlowVersions.push({
                        draft: entry.draft,
                        flowVersionId: entry.newFlowVersionId,
                        flowId: entry.flowId,
                        projectId: entry.projectId,
                        error: 'flow deleted',
                    })
                    continue
                }

                const sourceVersionRow = await flowVersionRepo().findOneBy({ id: entry.flowVersionId })
                if (isNil(sourceVersionRow)) {
                    failedFlowVersions.push({
                        draft: entry.draft,
                        flowVersionId: entry.newFlowVersionId,
                        flowId: entry.flowId,
                        projectId: entry.projectId,
                        error: 'pre-migration version row missing',
                    })
                    continue
                }

                const newRevertVersionId = apId()
                const { error: revertError } = await tryCatch(async () => {
                    await transaction(async (entityManager) => {
                        const revertVersion = sanitizeObjectForPostgresql({
                            ...sourceVersionRow,
                            id: newRevertVersionId,
                            state: entry.draft ? FlowVersionState.DRAFT : FlowVersionState.LOCKED,
                            created: dayjs().toISOString(),
                            updated: dayjs().toISOString(),
                        })
                        if (entry.draft) {
                            await flowVersionRepo(entityManager).update(
                                { flowId: entry.flowId, state: FlowVersionState.DRAFT },
                                { state: FlowVersionState.LOCKED },
                            )
                        }
                        await flowVersionRepo(entityManager).save(revertVersion)
                        if (!entry.draft) {
                            await flowRepo(entityManager).update(entry.flowId, { publishedVersionId: revertVersion.id })
                        }
                    })
                    await flowExecutionCache(log).invalidate(entry.flowId)
                })

                if (revertError) {
                    log.error({ flowId: entry.flowId, error: revertError }, 'Failed to revert flow')
                    failedFlowVersions.push({
                        draft: entry.draft,
                        flowVersionId: entry.newFlowVersionId,
                        flowId: entry.flowId,
                        projectId: entry.projectId,
                        error: revertError.message,
                    })
                    continue
                }

                migratedVersions.push({
                    draft: entry.draft,
                    flowVersionId: entry.newFlowVersionId,
                    flowId: entry.flowId,
                    projectId: entry.projectId,
                    newFlowVersionId: newRevertVersionId,
                })
            }
        })

        if (handlerError) {
            log.error({ migrationId, error: handlerError }, 'Flow migration revert failed unexpectedly')
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
        log.info({ platformId, migrationId, reverted: migratedVersions.length, skipped: failedFlowVersions.length }, 'Flow migration revert completed')
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

async function enqueueAiProviderModelMigration({ platformId, userId, request, reqLog }: {
    platformId: PlatformId
    userId: UserId
    request: AiProviderModelMigrationRequest
    reqLog: FastifyBaseLogger
}): Promise<FlowMigration> {
    const jobId = `migrate-flow-model-${platformId}`
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
            aiProviderModelType: request.aiProviderModelType,
            dryCheck: request.dryCheck,
            projectIds: request.projectIds,
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
}

async function enqueueAiProviderModelRevert({ platformId, userId, revertOfMigrationId, reqLog }: {
    platformId: PlatformId
    userId: UserId
    revertOfMigrationId: string
    reqLog: FastifyBaseLogger
}): Promise<FlowMigration> {
    const original = await migrationRepo().findOneBy({ id: revertOfMigrationId, platformId })
    if (isNil(original)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityType: 'FlowMigration', entityId: revertOfMigrationId },
        })
    }
    if (original.type !== FlowMigrationType.AI_PROVIDER_MODEL) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Only AI provider model migrations can be reverted' },
        })
    }
    if (original.status !== FlowMigrationStatus.COMPLETED) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Only completed migrations can be reverted' },
        })
    }
    if (original.params.dryCheck) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Dry-check migrations have nothing to revert' },
        })
    }

    const jobId = `migrate-flow-model-${platformId}`

    const migrationId = apId()
    const request: MigrateFlowsModelRequest = {
        type: FlowMigrationType.AI_PROVIDER_MODEL_REVERT,
        revertOfMigrationId,
    }
    const migration = await migrationRepo().save({
        id: migrationId,
        platformId,
        userId,
        type: FlowMigrationType.AI_PROVIDER_MODEL_REVERT,
        status: FlowMigrationStatus.RUNNING,
        migratedVersions: [],
        failedFlowVersions: [],
        params: { revertOfMigrationId },
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
}

async function assertNoActiveMigrationJob({ jobId, reqLog }: {
    jobId: string
    reqLog: FastifyBaseLogger
}): Promise<void> {
    const existingJob = await systemJobsSchedule(reqLog).getJob<SystemJobName.MIGRATE_FLOWS_MODEL>(jobId)
    const SKIP_JOB_STATES = ['active', 'delayed', 'waiting']
    if (existingJob && SKIP_JOB_STATES.includes(await existingJob.getState())) {
        throw new ActivepiecesError({
            code: ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS,
            params: { jobId },
        })
    }
}

async function assertModelTypeMatches({ log, platformId, request }: {
    log: FastifyBaseLogger
    platformId: PlatformId
    request: AiProviderModelMigrationRequest
}): Promise<void> {
    const { sourceModel, targetModel } = request
    const sourceProviderModels = await aiProviderService(log).listModels(platformId, sourceModel.provider)
    const targetProviderModels = await aiProviderService(log).listModels(platformId, targetModel.provider)
    const sourceProviderModel = sourceProviderModels.find((m) => m.id === sourceModel.model)
    const targetProviderModel = targetProviderModels.find((m) => m.id === targetModel.model)
    if (!sourceProviderModel) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: {
            entityType: 'AIProviderModel',
            entityId: `${sourceModel.provider}/${sourceModel.model}`,
        } })
    }
    if (!targetProviderModel) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: {
            entityType: 'AIProviderModel',
            entityId: `${targetModel.provider}/${targetModel.model}`,
        } })
    }
    if (sourceProviderModel.type !== targetProviderModel.type || sourceProviderModel.type !== request.aiProviderModelType) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: {
            message: 'Source and target models must be from the same type and the same aiProviderModelType',
        } })
    }
}

function dedupePieceVersionChanges(changes: PieceVersionChange[]): PieceVersionChange[] {
    const seen = new Map<string, PieceVersionChange>()
    for (const change of changes) {
        const key = `${change.from}→${change.to}`
        if (!seen.has(key)) {
            seen.set(key, change)
        }
    }
    return [...seen.values()]
}


