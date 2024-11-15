import { logger } from '@activepieces/server-shared'
import {
    ActionType,
    ActivepiecesError,
    apId,
    Cursor,
    ErrorCode,
    FlowId,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    isNil,
    LATEST_SCHEMA_VERSION,
    PlatformId,
    ProjectId,
    sanitizeObjectForPostgresql,
    SeekPage,
    TriggerType,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { FlowVersionEntity } from './flow-version-entity'
import { flowVersionSideEffects } from './flow-version-side-effects'
import { flowVersionValidationUtil } from './flow-version-validator-util'

const flowVersionRepo = repoFactory(FlowVersionEntity)

export const flowVersionService = {
    async lockPieceVersions({
        projectId,
        flowVersion,
        entityManager,
    }: LockPieceVersionsParams): Promise<FlowVersion> {
        if (flowVersion.state === FlowVersionState.LOCKED) {
            return flowVersion
        }

        const pieceVersion: Record<string, string> = {}
        const platformId = await projectService.getPlatformId(projectId)
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        for (const step of steps) {
            const stepTypeIsPiece = [ActionType.PIECE, TriggerType.PIECE].includes(
                step.type,
            )
            if (stepTypeIsPiece) {
                const pieceMetadata = await pieceMetadataService.getOrThrow({
                    projectId,
                    platformId,
                    name: step.settings.pieceName,
                    version: step.settings.pieceVersion,
                    entityManager,
                })
                pieceVersion[step.settings.pieceName] = pieceMetadata.version
            }
        }
        return flowStructureUtil.transferFlow(flowVersion, (step) => {
            const clonedStep = JSON.parse(JSON.stringify(step))
            if (pieceVersion[step.settings.pieceName]) {
                clonedStep.settings.pieceVersion = pieceVersion[step.settings.pieceName]
            }
            return clonedStep
        })
    },

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
                const previousVersion = await flowVersionService.getFlowVersionOrThrow({
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
                    },
                }]
                break
            }
            case FlowOperationType.LOCK_FLOW: {
                mutatedFlowVersion = await this.lockPieceVersions({
                    projectId,
                    flowVersion: mutatedFlowVersion,
                    entityManager,
                })

                operations = [userOperation]
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
            )
        }

        mutatedFlowVersion.updated = dayjs().toISOString()
        if (userId) {
            mutatedFlowVersion.updatedBy = userId
        }
        return flowVersionRepo(entityManager).save(
            sanitizeObjectForPostgresql(mutatedFlowVersion),
        )
    },

    async getOne(id: FlowVersionId): Promise<FlowVersion | null> {
        if (isNil(id)) {
            return null
        }
        return flowVersionRepo().findOneBy({
            id,
        })
    },

    async getLatestLockedVersionOrThrow(flowId: FlowId): Promise<FlowVersion> {
        return flowVersionRepo().findOneOrFail({
            where: {
                flowId,
                state: FlowVersionState.LOCKED,
            },
            order: {
                created: 'DESC',
            },
        })
    },
    async getOneOrThrow(id: FlowVersionId): Promise<FlowVersion> {
        const flowVersion = await flowVersionService.getOne(id)

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
            flowVersionRepo()
                .createQueryBuilder('flow_version')
                .leftJoinAndMapOne(
                    'flow_version.updatedByUser',
                    'user',
                    'user',
                    'flow_version."updatedBy" = "user"."id"',
                )
                .where({
                    flowId,
                }),
        )
        return paginationHelper.createPage<FlowVersion>(
            paginationResult.data,
            paginationResult.cursor,
        )
    },
    async getFlowVersionOrThrow({
        flowId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
    }: GetFlowVersionOrThrowParams): Promise<FlowVersion> {
        const flowVersion: FlowVersion | null = await flowVersionRepo(
            entityManager,
        ).findOne({
            where: {
                flowId,
                id: versionId,
            },
            //This is needed to return draft by default because it is always the latest one
            order: {
                created: 'DESC',
            },
        })

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

        return removeSecretsFromFlow(
            flowVersion,
            removeConnectionsName,
            removeSampleData,
        )
    },
    async createEmptyVersion(
        flowId: FlowId,
        request: {
            displayName: string
        },
    ): Promise<FlowVersion> {
        const flowVersion: NewFlowVersion = {
            id: apId(),
            displayName: request.displayName,
            flowId,
            trigger: {
                type: TriggerType.EMPTY,
                name: 'trigger',
                settings: {},
                valid: false,
                displayName: 'Select Trigger',
            },
            schemaVersion: LATEST_SCHEMA_VERSION,
            valid: false,
            state: FlowVersionState.DRAFT,
        }
        return flowVersionRepo().save(flowVersion)
    },
}

async function applySingleOperation(
    projectId: ProjectId,
    flowVersion: FlowVersion,
    operation: FlowOperationRequest,
    platformId: PlatformId,
): Promise<FlowVersion> {
    logger.info(`applying ${operation.type} to ${flowVersion.displayName}`)
    await flowVersionSideEffects.preApplyOperation({
        projectId,
        flowVersion,
        operation,
    })
    operation = await flowVersionValidationUtil.prepareRequest(projectId, platformId, operation)
    return flowOperations.apply(flowVersion, operation)
}

async function removeSecretsFromFlow(
    flowVersion: FlowVersion,
    removeConnectionNames: boolean,
    removeSampleData: boolean,
): Promise<FlowVersion> {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        const clonedStep = JSON.parse(JSON.stringify(step))
        if (removeConnectionNames) {
            clonedStep.settings.input = replaceConnections(clonedStep.settings.input)
        }
        if (removeSampleData && !isNil(clonedStep?.settings?.inputUiInfo)) {
            clonedStep.settings.inputUiInfo.sampleDataFileId = undefined
            clonedStep.settings.inputUiInfo.currentSelectedData = undefined
            clonedStep.settings.inputUiInfo.lastTestDate = undefined
        }
        return clonedStep
    })
}

function replaceConnections(
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
            replacedObj[key] = replaceConnections(value as Record<string, unknown>)
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

type LockPieceVersionsParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    entityManager?: EntityManager
}
