import { TSchema, Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import {
    ActionType,
    apId,
    BranchActionSettingsWithValidation,
    CodeActionSettings,
    flowHelper,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    LoopOnItemsActionSettingsWithValidation,
    PieceActionSettings,
    PieceTriggerSettings,
    ProjectId,
    TriggerType,
} from '@activepieces/shared'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { fileService } from '../../file/file.service'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { FlowVersionEntity } from './flow-version-entity'
import { flowVersionSideEffects } from './flow-version-side-effects'
import { FlowViewMode, DEFAULT_SAMPLE_DATA_SETTINGS } from '@activepieces/shared'
import { isNil } from '@activepieces/shared'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

const branchSettingsValidator = TypeCompiler.Compile(BranchActionSettingsWithValidation)
const loopSettingsValidator = TypeCompiler.Compile(LoopOnItemsActionSettingsWithValidation)
const flowVersionRepo = databaseConnection.getRepository(FlowVersionEntity)

export const flowVersionService = {
    async overwriteVersion(flowVersionId: FlowVersionId, mutatedFlowVersion: FlowVersion) {
        await flowVersionRepo.update(flowVersionId, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>)
        return await flowVersionRepo.findOneBy({
            id: flowVersionId,
        })
    },
    async applyOperation(projectId: ProjectId, flowVersion: FlowVersion, userOperation: FlowOperationRequest): Promise<FlowVersion> {
        let operations: FlowOperationRequest[] = []
        switch (userOperation.type) {
            case FlowOperationType.IMPORT_FLOW:
            {
                const actionsToRemove = flowHelper.getAllStepsAtFirstLevel(flowVersion.trigger).filter(step => flowHelper.isAction(step.type))
                for (const step of actionsToRemove) {
                    operations.push({
                        type: FlowOperationType.DELETE_ACTION,
                        request: {
                            name: step.name,
                        },
                    })
                }
                const trigger = userOperation.request.trigger
                if (trigger) {
                    operations.push({
                        type: FlowOperationType.UPDATE_TRIGGER,
                        request: trigger,
                    })
                    operations.push(...flowHelper.getImportOperations(trigger))
                }
                break
            }
            default:
                operations = [userOperation]
                break

        }
        let mutatedFlowVersion = flowVersion
        for (const operation of operations) {
            mutatedFlowVersion = await applySingleOperation(projectId, mutatedFlowVersion, operation)
        }
        await flowVersionRepo.update(flowVersion.id, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>)
        return (await flowVersionRepo.findOneBy({
            id: flowVersion.id,
        }))!
    },

    async getOne(id: FlowVersionId): Promise<FlowVersion | null> {
        if (id === null || id === undefined) {
            return null
        }
        return await flowVersionRepo.findOneBy({
            id,
        })
    },
    async getOneOrThrow(id: FlowVersionId): Promise<FlowVersion> {
        const flowVersion = await flowVersionService.getOne(id)
        if (flowVersion === null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_VERSION_NOT_FOUND,
                params: {
                    id,
                },
            })
        }

        return flowVersion
    },
    async getFlowVersion(projectId: ProjectId, flowId: FlowId, versionId: FlowVersionId | undefined, viewMode: FlowViewMode): Promise<FlowVersion | null> {
        const flowVersion = await flowVersionRepo.findOne({
            where: {
                flowId,
                id: versionId,
            },
            order: {
                created: 'DESC',
            },
        })
        if (viewMode === FlowViewMode.WITH_ARTIFACTS) {
            return addArtifactsAsBase64(projectId, flowVersion)
        }
        if (viewMode === FlowViewMode.TEMPLATE) {
            return addArtifactsAsBase64(projectId, await removeSecrets(flowVersion))
        }
        return flowVersion
    },
    async createEmptyVersion(flowId: FlowId, request: {
        displayName: string
    }): Promise<FlowVersion> {
        const flowVersion: Partial<FlowVersion> = {
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
        return await flowVersionRepo.save(flowVersion)
    },
}

async function applySingleOperation(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest): Promise<FlowVersion> {
    await flowVersionSideEffects.preApplyOperation({
        projectId,
        flowVersion,
        operation: operation,
    })
    operation = await prepareRequest(projectId, flowVersion, operation)
    return flowHelper.apply(flowVersion, operation)
}

async function removeSecrets(flowVersion: FlowVersion | null) {
    if (flowVersion === null) {
        return null
    }
    const flowVersionWithArtifacts: FlowVersion = JSON.parse(JSON.stringify(flowVersion))

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

function replaceConnections(obj: Record<string, unknown>): Record<string, unknown> {
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


async function addArtifactsAsBase64(projectId: ProjectId, flowVersion: FlowVersion | null) {
    if (flowVersion === null) {
        return null
    }
    const flowVersionWithArtifacts: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const artifactPromises = []

    const steps = flowHelper.getAllSteps(flowVersionWithArtifacts.trigger)
    for (const step of steps) {
        if (step.type === ActionType.CODE) {
            const codeSettings: CodeActionSettings = step.settings
            const artifactPromise = fileService
                .getOne({ projectId: projectId, fileId: codeSettings.artifactSourceId! })
                .then((artifact) => {
                    if (artifact !== null) {
                        codeSettings.artifactSourceId = undefined
                        codeSettings.artifact = artifact.data.toString('base64')
                    }
                })
            artifactPromises.push(artifactPromise)
        }
    }

    await Promise.all(artifactPromises)
    return flowVersionWithArtifacts
}

async function prepareRequest(projectId: ProjectId, flowVersion: FlowVersion, request: FlowOperationRequest) {
    const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request))
    switch (clonedRequest.type) {
        case FlowOperationType.ADD_ACTION:
            clonedRequest.request.action.valid = true
            switch (clonedRequest.request.action.type) {
                case ActionType.MISSING:
                    clonedRequest.request.action.valid = false
                    break
                case ActionType.LOOP_ON_ITEMS:
                    clonedRequest.request.action.valid = loopSettingsValidator.Check(clonedRequest.request.action.settings)
                    break
                case ActionType.BRANCH:
                    clonedRequest.request.action.valid = branchSettingsValidator.Check(clonedRequest.request.action.settings)
                    break
                case ActionType.PIECE:
                    clonedRequest.request.action.valid = await validateAction({
                        settings: clonedRequest.request.action.settings,
                        projectId: projectId,
                    })
                    break
                case ActionType.CODE: {
                    const codeSettings: CodeActionSettings = clonedRequest.request.action.settings
                    await uploadArtifact(projectId, codeSettings)
                    break
                }
            }
            break
        case FlowOperationType.UPDATE_ACTION:
            clonedRequest.request.valid = true
            switch (clonedRequest.request.type) {
                case ActionType.MISSING:
                    clonedRequest.request.valid = false
                    break
                case ActionType.LOOP_ON_ITEMS:
                    clonedRequest.request.valid = loopSettingsValidator.Check(clonedRequest.request.settings)
                    break
                case ActionType.BRANCH:
                    clonedRequest.request.valid = branchSettingsValidator.Check(clonedRequest.request.settings)
                    break
                case ActionType.PIECE:
                    clonedRequest.request.valid = await validateAction({
                        settings: clonedRequest.request.settings,
                        projectId: projectId,
                    })
                    break
                case ActionType.CODE: {
                    const codeSettings: CodeActionSettings = clonedRequest.request.settings
                    await uploadArtifact(projectId, codeSettings)
                    const previousStep = flowHelper.getStep(flowVersion, clonedRequest.request.name)
                    if (
                        previousStep !== undefined &&
                        previousStep.type === ActionType.CODE &&
                        codeSettings.artifactSourceId !== previousStep.settings.artifactSourceId
                    ) {
                        await deleteArtifact(projectId, previousStep.settings)
                    }
                    break
                }
            }
            break
        case FlowOperationType.DELETE_ACTION: {
            const previousStep = flowHelper.getStep(flowVersion, clonedRequest.request.name)
            if (previousStep !== undefined && previousStep.type === ActionType.CODE) {
                await deleteArtifact(projectId, previousStep.settings)
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
                        projectId: projectId,
                    })
                    break
                default:
                    clonedRequest.request.valid = true
                    break
            }
            break
        default:
            break
    }
    return clonedRequest
}


async function validateAction({ projectId, settings }: { projectId: ProjectId, settings: PieceActionSettings }) {

    if (
        settings.pieceName === undefined ||
        settings.pieceVersion === undefined ||
        settings.actionName === undefined ||
        settings.input === undefined
    ) {
        return false
    }

    const piece = await pieceMetadataService.get({
        projectId: projectId,
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
    return validateProps(action.props, settings.input)
}

async function validateTrigger({ settings, projectId }: { settings: PieceTriggerSettings, projectId: ProjectId }) {
    if (
        settings.pieceName === undefined ||
        settings.pieceVersion === undefined ||
        settings.triggerName === undefined ||
        settings.input === undefined
    ) {
        return false
    }

    const piece = await pieceMetadataService.get({
        projectId: projectId,
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
    return validateProps(trigger.props, settings.input)
}

function validateProps(props: PiecePropertyMap, input: Record<string, unknown>) {
    const propsSchema = buildSchema(props)
    const propsValidator = TypeCompiler.Compile(propsSchema)
    return propsValidator.Check(input)
}

function buildSchema(props: PiecePropertyMap): TSchema {
    const entries = Object.entries(props)
    const nonNullableUnknownPropType = Type.Not(Type.Union([Type.Null(), Type.Undefined()]), Type.Unknown())
    const propsSchema: Record<string, TSchema> = {}
    for (const [name, property] of entries) {
        switch (property.type) {
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
                propsSchema[name] = Type.Union([Type.RegEx(RegExp('{{1}{connections.(.*?)}{1}}')), Type.String()])
                break
            case PropertyType.ARRAY:
                // Only accepts connections variable.
                propsSchema[name] = Type.Union([Type.Array(Type.String({})), Type.String()])
                break
            case PropertyType.OBJECT:
                propsSchema[name] = Type.Union([Type.Record(Type.String(), Type.Any()), Type.String()])
                break
            case PropertyType.JSON:
                propsSchema[name] = Type.Union([Type.Record(Type.String(), Type.Any()), Type.Array(Type.Any()), Type.String()])
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
            propsSchema[name] = Type.Optional(Type.Union([Type.Null(), Type.Undefined(), propsSchema[name]]))
        }
    }

    return Type.Object(propsSchema)
}

async function deleteArtifact(projectId: ProjectId, codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
    const requests: Promise<void>[] = []
    if (codeSettings.artifactSourceId !== undefined) {
        requests.push(fileService.delete({ projectId: projectId, fileId: codeSettings.artifactSourceId }))
    }
    if (codeSettings.artifactPackagedId !== undefined) {
        requests.push(fileService.delete({ projectId: projectId, fileId: codeSettings.artifactPackagedId }))
    }
    await Promise.all(requests)
    return codeSettings
}

async function uploadArtifact(projectId: ProjectId, codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
    if (codeSettings.artifact !== undefined) {
        const bufferFromBase64 = Buffer.from(codeSettings.artifact, 'base64')

        const savedFile = await fileService.save({
            projectId,
            data: bufferFromBase64,
        })

        codeSettings.artifact = undefined
        codeSettings.artifactSourceId = savedFile.id
        codeSettings.artifactPackagedId = undefined
    }
    return codeSettings
}
