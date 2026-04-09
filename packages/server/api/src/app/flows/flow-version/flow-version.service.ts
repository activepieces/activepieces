import {
    ActivepiecesError,
    apId,
    Cursor,
    ErrorCode,
    FlowId,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    Note,
    PlatformId,
    ProjectId,
    sanitizeObjectForPostgresql,
    SeekPage,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, FindOneOptions } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { sampleDataService } from '../step-run/sample-data.service'
import { FlowVersionEntity } from './flow-version-entity'
import { flowVersionMigrationService } from './flow-version-migration.service'
import { flowVersionSideEffects } from './flow-version-side-effects'
import { flowVersionValidationUtil } from './flow-version-validator-util'

export const flowVersionRepo = repoFactory(FlowVersionEntity)

export const flowVersionService = (log: FastifyBaseLogger) => ({
    async applyOperation({
        flowVersion,
        projectId,
        userId,
        userOperation,
        entityManager,
        platformId,
    }: ApplyOperationParams): Promise<FlowVersion> {
        let operations: FlowOperationRequest[] = []
        let mutatedFlowVersion: FlowVersion = flowVersion

        switch (userOperation.type) {
            case FlowOperationType.USE_AS_DRAFT: {
                const previousVersion = await flowVersionService(log).getFlowVersionOrThrow({
                    flowId: flowVersion.flowId,
                    versionId: userOperation.request.versionId,
                    removeConnectionsName: false,
                })
                operations = [{
                    type: FlowOperationType.IMPORT_FLOW,
                    request: {
                        trigger: previousVersion.trigger,
                        displayName: previousVersion.displayName,
                        schemaVersion: previousVersion.schemaVersion,
                        notes: previousVersion.notes,
                    },
                }]
                break
            }
            case FlowOperationType.SAVE_SAMPLE_DATA: {
                const sampleDataSettings = await sampleDataService(log).saveSampleDataFileIdsInStep({
                    projectId,
                    flowVersionId: mutatedFlowVersion.id,
                    stepName: userOperation.request.stepName,
                    payload: userOperation.request.payload,
                    type: userOperation.request.type,
                })
                operations = [{
                    type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
                    request: {
                        stepName: userOperation.request.stepName,
                        sampleDataSettings,
                    },
                }]
                break
            }
            default: {
                operations = [userOperation]
                break
            }
        }
        for (const operation of operations) {
            mutatedFlowVersion = await applySingleOperation(
                projectId,
                mutatedFlowVersion,
                operation,
                platformId,
                log,
                userId,
            )
            if (operation.type === FlowOperationType.ADD_NOTE) {
                const noteIndex = mutatedFlowVersion.notes.findIndex((note) => note.id === operation.request.id)
                if (noteIndex !== -1) {
                    mutatedFlowVersion.notes[noteIndex] = { ...mutatedFlowVersion.notes[noteIndex], ownerId: userId }
                }
            }
        }

        mutatedFlowVersion.updated = dayjs().toISOString()
        if (userId) {
            mutatedFlowVersion.updatedBy = userId
        }
        mutatedFlowVersion.connectionIds = flowStructureUtil.extractConnectionIds(mutatedFlowVersion)
        mutatedFlowVersion.agentIds = flowStructureUtil.extractAgentIds(mutatedFlowVersion)
        return flowVersionRepo(entityManager).save(sanitizeObjectForPostgresql(mutatedFlowVersion))
    },

    async getOne(id: FlowVersionId): Promise<FlowVersion | null> {
        if (isNil(id)) {
            return null
        }
        return findOne(log, {
            where: {
                id,
            },
        })
    },

    async exists(id: FlowVersionId): Promise<boolean> {
        return flowVersionRepo().exists({
            where: {
                id,
            },
        })
    },
    async getLatestVersion(flowId: FlowId, state: FlowVersionState): Promise<FlowVersion | null> {
        return findOne(log, {
            where: {
                flowId,
                state,
            },
            order: {
                created: 'DESC',
            },
        })
    },

    async getLatestVersionsByFlowIds(flowIds: FlowId[], projectId?: ProjectId): Promise<Map<FlowId, FlowVersion>> {
        if (flowIds.length === 0) {
            return new Map()
        }
        const latestVersions = await flowVersionRepo()
            .createQueryBuilder('fv')
            .where('fv.flowId IN (:...flowIds)', { flowIds })
            .distinctOn(['fv.flowId'])
            .orderBy('fv.flowId')
            .addOrderBy('fv.created', 'DESC')
            .getMany()
        const migratedEntries = await Promise.all(
            latestVersions.map(async (version) => {
                const migrated = await flowVersionMigrationService(log).migrate(version, projectId)
                return [version.flowId, migrated] as const
            }),
        )
        return new Map(migratedEntries)
    },

    async getLatestLockedVersionOrThrow(flowId: FlowId): Promise<FlowVersion> {
        const lockedVersion = await this.getLatestVersion(flowId, FlowVersionState.LOCKED)
        if (isNil(lockedVersion)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: flowId,
                    entityType: 'FlowVersion',
                },
            })
        }
        return lockedVersion
    },
    async getOneOrThrow(id: FlowVersionId): Promise<FlowVersion> {
        const flowVersion = await flowVersionService(log).getOne(id)

        if (isNil(flowVersion)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'FlowVersion',
                },
            })
        }

        return flowVersion
    },
    async list({
        cursorRequest,
        limit,
        flowId,
    }: ListFlowVersionParams): Promise<SeekPage<FlowVersion>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: FlowVersionEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const paginationResult = await paginator.paginate(
            flowVersionRepo().createQueryBuilder()
                .where({
                    flowId,
                }),
        )
        const promises = paginationResult.data.map(async (flowVersion) => {
            return {
                ...flowVersion,
                updatedByUser: isNil(flowVersion.updatedBy) ? null : await userService(log).getMetaInformation({
                    id: flowVersion.updatedBy,
                }),
            }
        })
        return paginationHelper.createPage<FlowVersion>(
            await Promise.all(promises),
            paginationResult.cursor,
        )
    },
    async getFlowVersionOrThrow({
        flowId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
        projectId,
    }: GetFlowVersionOrThrowParams): Promise<FlowVersion> {
        const flowVersion: FlowVersion | null = await findOne(log, {
            where: {
                flowId,
                id: versionId,
            },
            //This is needed to return draft by default because it is always the latest one
            order: {
                created: 'DESC',
            },
        }, entityManager, projectId)

        if (isNil(flowVersion)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: versionId,
                    entityType: 'FlowVersion',
                    message: `flowId=${flowId}`,
                },
            })
        }

        return this.removeConnectionsAndSampleDataFromFlowVersion(
            flowVersion,
            removeConnectionsName,
            removeSampleData,
        )
    },
    async createEmptyVersion(
        flowId: FlowId,
        request: {
            displayName: string
            notes: Note[]
        },
    ): Promise<FlowVersion> {
        const flowVersion: NewFlowVersion = {
            id: apId(),
            displayName: request.displayName,
            flowId,
            trigger: {
                type: FlowTriggerType.EMPTY,
                name: 'trigger',
                settings: {},
                valid: false,
                displayName: 'Select Trigger',
                lastUpdatedDate: dayjs().toISOString(),
            },
            schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
            connectionIds: [],
            agentIds: [],
            valid: false,
            state: FlowVersionState.DRAFT,
            notes: request.notes,
        }
        return flowVersionRepo().save(flowVersion)
    },
    removeConnectionsAndSampleDataFromFlowVersion(
        flowVersion: FlowVersion,
        removeConnectionNames: boolean,
        removeSampleData: boolean,
    ): FlowVersion {
        return flowStructureUtil.transferFlow(flowVersion, (step) => {
            const clonedStep = JSON.parse(JSON.stringify(step))
            if (removeConnectionNames) {
                clonedStep.settings.input = removeConnectionsFromInput(clonedStep.settings.input)
            }
            if (removeSampleData && !isNil(clonedStep?.settings?.sampleData)) {
                clonedStep.settings.sampleData.sampleDataFileId = undefined
                clonedStep.settings.sampleData.sampleDataInputFileId = undefined
                clonedStep.settings.sampleData.lastTestDate = undefined
            }
            return clonedStep
        })
    },
})



async function findOne(log: FastifyBaseLogger, options: FindOneOptions, entityManager?: EntityManager, projectId?: ProjectId): Promise<FlowVersion | null> {
    const flowVersion = await flowVersionRepo(entityManager).findOne(options)
    if (isNil(flowVersion)) {
        return null
    }
    return flowVersionMigrationService(log).migrate(flowVersion, projectId)
}


async function applySingleOperation(
    projectId: ProjectId,
    flowVersion: FlowVersion,
    operation: FlowOperationRequest,
    platformId: PlatformId,
    log: FastifyBaseLogger,
    userId: UserId | null,
): Promise<FlowVersion> {
    await flowVersionSideEffects(log).preApplyOperation({
        projectId,
        flowVersion,
        operation,
    })
    const preparedOperation = await flowVersionValidationUtil(log).prepareRequest({ platformId, request: operation, userId })
    const updatedFlowVersion = flowOperations.apply(flowVersion, preparedOperation)
    return updatedFlowVersion
}

function removeConnectionsFromInput(
    obj: Record<string, unknown>,
): Record<string, unknown> {
    if (isNil(obj)) {
        return obj
    }
    const replacedObj: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            replacedObj[key] = value
        }
        else if (typeof value === 'object' && value !== null) {
            replacedObj[key] = removeConnectionsFromInput(value as Record<string, unknown>)
        }
        else if (typeof value === 'string') {
            const replacedValue = value.replace(/\{{connections\.[^}]*}}/g, '')
            replacedObj[key] = replacedValue === '' ? undefined : replacedValue
        }
        else {
            replacedObj[key] = value
        }
    }
    return replacedObj
}

type GetFlowVersionOrThrowParams = {
    flowId: FlowId
    versionId: FlowVersionId | undefined
    removeConnectionsName?: boolean
    removeSampleData?: boolean
    entityManager?: EntityManager
    projectId?: ProjectId
}

type NewFlowVersion = Omit<FlowVersion, 'created' | 'updated'>

type ListFlowVersionParams = {
    flowId: FlowId
    cursorRequest: Cursor | null
    limit: number
}

type ApplyOperationParams = {
    userId: UserId | null
    projectId: ProjectId
    platformId: PlatformId
    flowVersion: FlowVersion
    userOperation: FlowOperationRequest
    entityManager?: EntityManager
}

