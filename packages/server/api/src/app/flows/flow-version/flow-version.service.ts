import { TSchema, Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import {
    ActionType,
    apId,
    BranchActionSettingsWithValidation,
    Cursor,
    flowHelper,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    ImportFlowRequest,
    LoopOnItemsActionSettingsWithValidation,
    PieceActionSettings,
    PieceTriggerSettings,
    ProjectId,
    TriggerType,
    SeekPage,
    UserId,
} from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from './flow-version-entity'
import { flowVersionSideEffects } from './flow-version-side-effects'
import { DEFAULT_SAMPLE_DATA_SETTINGS } from '@activepieces/shared'
import { isNil } from '@activepieces/shared'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import dayjs from 'dayjs'
import { logger } from 'server-shared'
import { stepFileService } from '../step-file/step-file.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'

const branchSettingsValidator = TypeCompiler.Compile(
    BranchActionSettingsWithValidation,
)
const loopSettingsValidator = TypeCompiler.Compile(
    LoopOnItemsActionSettingsWithValidation,
)
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

        return flowHelper.transferFlowAsync(flowVersion, async (step) => {
            const clonedStep = JSON.parse(JSON.stringify(step))
            const stepTypeIsPiece = [ActionType.PIECE, TriggerType.PIECE].includes(
                step.type,
            )

            if (stepTypeIsPiece) {
                const pieceMetadata = await pieceMetadataService.getOrThrow({
                    projectId,
                    name: step.settings.pieceName,
                    version: step.settings.pieceVersion,
                    entityManager,
                })

                clonedStep.settings.pieceVersion = pieceMetadata.version
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
    }: ApplyOperationParams): Promise<FlowVersion> {
        let operations: FlowOperationRequest[] = []
        let mutatedFlowVersion: FlowVersion = flowVersion
        
        switch (userOperation.type) {
            case FlowOperationType.USE_AS_DRAFT: {
                const previousVersion = await flowVersionService.getFlowVersionOrThrow({
                    flowId: flowVersion.flowId,
                    versionId: userOperation.request.versionId,
                    removeSecrets: false,
                })

                operations = handleImportFlowOperation(flowVersion, previousVersion)
                break
            }

            case FlowOperationType.IMPORT_FLOW: {
                operations = handleImportFlowOperation(
                    flowVersion,
                    userOperation.request,
                )
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

            case FlowOperationType.DUPLICATE_ACTION: {
                mutatedFlowVersion = await this.getFlowVersionOrThrow({
                    flowId: flowVersion.flowId,
                    versionId: flowVersion.id,
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
            )
        }

        mutatedFlowVersion.updated = dayjs().toISOString()
        mutatedFlowVersion.updatedBy = userId

        return flowVersionRepo(entityManager).save(mutatedFlowVersion)
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
    }: {
        cursorRequest: Cursor | null
        limit: number
        flowId: string
    }): Promise<SeekPage<FlowVersion>> {
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
            flowVersionRepo().createQueryBuilder('flow_version').leftJoinAndMapOne(
                'flow_version.updatedByUser',
                'user',
                'user',
                'flow_version.updatedBy = "user"."id"',
            ).where({
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
        removeSecrets = false,
    }: GetFlowVersionOrThrowParams): Promise<FlowVersion> {
        let flowVersion: FlowVersion | null = await flowVersionRepo().findOne({
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

        if (removeSecrets) {
            flowVersion = await removeSecretsFromFlow(flowVersion)
        }

        return flowVersion
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
): Promise<FlowVersion> {
    logger.info(`applying ${operation.type} to ${flowVersion.displayName}`)
    await flowVersionSideEffects.preApplyOperation({
        projectId,
        flowVersion,
        operation,
    })
    operation = await prepareRequest(projectId, flowVersion, operation)
    return flowHelper.apply(flowVersion, operation)
}

async function removeSecretsFromFlow(
    flowVersion: FlowVersion,
): Promise<FlowVersion> {
    const flowVersionWithArtifacts: FlowVersion = JSON.parse(
        JSON.stringify(flowVersion),
    )
    const steps = flowHelper.getAllSteps(flowVersionWithArtifacts.trigger)
    for (const step of steps) {
    /*
        Remove Sample Data & connections
        */
        step.settings.inputUiInfo = DEFAULT_SAMPLE_DATA_SETTINGS
        step.settings.input = replaceConnections(step.settings.input)
    }
    return flowVersionWithArtifacts
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

function handleImportFlowOperation(
    flowVersion: FlowVersion,
    operation: ImportFlowRequest,
): FlowOperationRequest[] {
    const actionsToRemove = flowHelper
        .getAllStepsAtFirstLevel(flowVersion.trigger)
        .filter((step) => flowHelper.isAction(step.type))
    const operations: FlowOperationRequest[] = actionsToRemove.map((step) => ({
        type: FlowOperationType.DELETE_ACTION,
        request: {
            name: step.name,
        },
    }))
    operations.push({
        type: FlowOperationType.UPDATE_TRIGGER,
        request: operation.trigger,
    })
    operations.push({
        type: FlowOperationType.CHANGE_NAME,
        request: {
            displayName: operation.displayName,
        },
    })
    operations.push(...flowHelper.getImportOperations(operation.trigger))
    return operations
}

async function prepareRequest(
    projectId: ProjectId,
    flowVersion: FlowVersion,
    request: FlowOperationRequest,
): Promise<FlowOperationRequest> {
    const clonedRequest: FlowOperationRequest = JSON.parse(
        JSON.stringify(request),
    )
    switch (clonedRequest.type) {
        case FlowOperationType.ADD_ACTION:
            clonedRequest.request.action.valid = true
            switch (clonedRequest.request.action.type) {
                case ActionType.LOOP_ON_ITEMS:
                    clonedRequest.request.action.valid = loopSettingsValidator.Check(
                        clonedRequest.request.action.settings,
                    )
                    break
                case ActionType.BRANCH:
                    clonedRequest.request.action.valid = branchSettingsValidator.Check(
                        clonedRequest.request.action.settings,
                    )
                    break
                case ActionType.PIECE:
                    clonedRequest.request.action.valid = await validateAction({
                        settings: clonedRequest.request.action.settings,
                        projectId,
                    })
                    break
                case ActionType.CODE: {
                    break
                }
            }
            break
        case FlowOperationType.UPDATE_ACTION:
            clonedRequest.request.valid = true
            switch (clonedRequest.request.type) {
                case ActionType.LOOP_ON_ITEMS:
                    clonedRequest.request.valid = loopSettingsValidator.Check(
                        clonedRequest.request.settings,
                    )
                    break
                case ActionType.BRANCH:
                    clonedRequest.request.valid = branchSettingsValidator.Check(
                        clonedRequest.request.settings,
                    )
                    break
                case ActionType.PIECE: {
                    clonedRequest.request.valid = await validateAction({
                        settings: clonedRequest.request.settings,
                        projectId,
                    })
                    const previousStep = flowHelper.getStep(
                        flowVersion,
                        clonedRequest.request.name,
                    )
                    if (
                        previousStep !== undefined &&
            previousStep.type === ActionType.PIECE &&
            clonedRequest.request.settings.pieceName !==
              previousStep.settings.pieceName
                    ) {
                        await stepFileService.deleteAll({
                            projectId,
                            flowId: flowVersion.flowId,
                            stepName: previousStep.name,
                        })
                    }
                    break
                }
                case ActionType.CODE: {
                    break
                }
            }
            break
        case FlowOperationType.DELETE_ACTION: {
            const previousStep = flowHelper.getStep(
                flowVersion,
                clonedRequest.request.name,
            )
            if (
                previousStep !== undefined &&
        previousStep.type === ActionType.PIECE
            ) {
                await stepFileService.deleteAll({
                    projectId,
                    flowId: flowVersion.flowId,
                    stepName: previousStep.name,
                })
            }
            break
        }
        case FlowOperationType.UPDATE_TRIGGER:
            switch (clonedRequest.request.type) {
                case TriggerType.EMPTY:
                    clonedRequest.request.valid = false
                    break
                case TriggerType.PIECE:
                    clonedRequest.request.valid = await validateTrigger({
                        settings: clonedRequest.request.settings,
                        projectId,
                    })
                    break
            }
            break

        default:
            break
    }
    return clonedRequest
}

async function validateAction({
    projectId,
    settings,
}: {
    projectId: ProjectId
    settings: PieceActionSettings
}): Promise<boolean> {
    if (
        isNil(settings.pieceName) ||
    isNil(settings.pieceVersion) ||
    isNil(settings.actionName) ||
    isNil(settings.input)
    ) {
        return false
    }

    const piece = await pieceMetadataService.getOrThrow({
        projectId,
        name: settings.pieceName,
        version: settings.pieceVersion,
    })

    if (isNil(piece)) {
        return false
    }
    const action = piece.actions[settings.actionName]
    if (isNil(action)) {
        return false
    }
    const props = action.props
    if (!isNil(piece.auth) && action.requireAuth) {
        props.auth = piece.auth
    }
    return validateProps(props, settings.input)
}

async function validateTrigger({
    settings,
    projectId,
}: {
    settings: PieceTriggerSettings
    projectId: ProjectId
}): Promise<boolean> {
    if (
        isNil(settings.pieceName) ||
    isNil(settings.pieceVersion) ||
    isNil(settings.triggerName) ||
    isNil(settings.input)
    ) {
        return false
    }

    const piece = await pieceMetadataService.getOrThrow({
        projectId,
        name: settings.pieceName,
        version: settings.pieceVersion,
    })

    if (isNil(piece)) {
        return false
    }
    const trigger = piece.triggers[settings.triggerName]
    if (isNil(trigger)) {
        return false
    }
    const props = trigger.props
    if (!isNil(piece.auth)) {
        props.auth = piece.auth
    }
    return validateProps(props, settings.input)
}

function validateProps(
    props: PiecePropertyMap,
    input: Record<string, unknown>,
): boolean {
    const propsSchema = buildSchema(props)
    const propsValidator = TypeCompiler.Compile(propsSchema)
    return propsValidator.Check(input)
}

function buildSchema(props: PiecePropertyMap): TSchema {
    const entries = Object.entries(props)
    const nonNullableUnknownPropType = Type.Not(
        Type.Union([Type.Null(), Type.Undefined()]),
        Type.Unknown(),
    )
    const propsSchema: Record<string, TSchema> = {}
    for (const [name, property] of entries) {
        switch (property.type) {
            case PropertyType.MARKDOWN:
                propsSchema[name] = Type.Optional(
                    Type.Union([Type.Null(), Type.Undefined(), Type.Never()]),
                )
                break
            case PropertyType.DATE_TIME:
            case PropertyType.SHORT_TEXT:
            case PropertyType.LONG_TEXT:
            case PropertyType.FILE:
                propsSchema[name] = Type.String({
                    minLength: property.required ? 1 : undefined,
                })
                break
            case PropertyType.CHECKBOX:
                propsSchema[name] = Type.Union([Type.Boolean(), Type.String({})])
                break
            case PropertyType.NUMBER:
                // Because it could be a variable
                propsSchema[name] = Type.String({})
                break
            case PropertyType.STATIC_DROPDOWN:
                propsSchema[name] = nonNullableUnknownPropType
                break
            case PropertyType.DROPDOWN:
                propsSchema[name] = nonNullableUnknownPropType
                break
            case PropertyType.BASIC_AUTH:
            case PropertyType.CUSTOM_AUTH:
            case PropertyType.SECRET_TEXT:
            case PropertyType.OAUTH2:
                // Only accepts connections variable.
                propsSchema[name] = Type.Union([
                    Type.RegEx(RegExp('{{1}{connections.(.*?)}{1}}')),
                    Type.String(),
                ])
                break
            case PropertyType.ARRAY:
                // Only accepts connections variable.
                propsSchema[name] = Type.Union([
                    Type.Array(Type.Unknown({})),
                    Type.String(),
                ])
                break
            case PropertyType.OBJECT:
                propsSchema[name] = Type.Union([
                    Type.Record(Type.String(), Type.Any()),
                    Type.String(),
                ])
                break
            case PropertyType.JSON:
                propsSchema[name] = Type.Union([
                    Type.Record(Type.String(), Type.Any()),
                    Type.Array(Type.Any()),
                    Type.String(),
                ])
                break
            case PropertyType.MULTI_SELECT_DROPDOWN:
                propsSchema[name] = Type.Union([Type.Array(Type.Any()), Type.String()])
                break
            case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
                propsSchema[name] = Type.Union([Type.Array(Type.Any()), Type.String()])
                break
            case PropertyType.DYNAMIC:
                propsSchema[name] = Type.Record(Type.String(), Type.Any())
                break
        }

        if (!property.required) {
            propsSchema[name] = Type.Optional(
                Type.Union([Type.Null(), Type.Undefined(), propsSchema[name]]),
            )
        }
    }

    return Type.Object(propsSchema)
}

type GetFlowVersionOrThrowParams = {
    flowId: FlowId
    versionId: FlowVersionId | undefined
    removeSecrets?: boolean
}

type NewFlowVersion = Omit<FlowVersion, 'created' | 'updated'>

type ApplyOperationParams = {
    userId: UserId
    projectId: ProjectId
    flowVersion: FlowVersion
    userOperation: FlowOperationRequest
    entityManager?: EntityManager
}

type LockPieceVersionsParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    entityManager?: EntityManager
}
