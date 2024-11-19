import { 
    PiecePropertyMap, 
    PropertyType, 
} from '@activepieces/pieces-framework'
import {
    ActionType,
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    LoopOnItemsActionSettings,
    PieceActionSettings,
    PieceTriggerSettings,
    PlatformId,
    ProjectId,
    RouterActionSettingsWithValidation,
    TriggerType,
} from '@activepieces/shared'
import { TSchema, Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

const loopSettingsValidator = TypeCompiler.Compile(LoopOnItemsActionSettings)
const routerSettingsValidator = TypeCompiler.Compile(RouterActionSettingsWithValidation)

export const flowVersionValidationUtil = {
    async prepareRequest(
        projectId: ProjectId,
        platformId: PlatformId,
        request: FlowOperationRequest,
    ): Promise<FlowOperationRequest> {
        const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request))
        
        switch (clonedRequest.type) {
            case FlowOperationType.ADD_ACTION:
                clonedRequest.request.action.valid = true
                switch (clonedRequest.request.action.type) {
                    case ActionType.LOOP_ON_ITEMS:
                        clonedRequest.request.action.valid = loopSettingsValidator.Check(
                            clonedRequest.request.action.settings,
                        )
                        break
                    case ActionType.PIECE:
                        clonedRequest.request.action.valid = await validateAction({
                            settings: clonedRequest.request.action.settings,
                            projectId,
                            platformId,
                        })
                        break
                    case ActionType.ROUTER:
                        clonedRequest.request.action.valid = routerSettingsValidator.Check(
                            clonedRequest.request.action.settings,
                        )
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
                    case ActionType.PIECE: {
                        clonedRequest.request.valid = await validateAction({
                            settings: clonedRequest.request.settings,
                            projectId,
                            platformId,
                        })
                        break
                    }
                    case ActionType.ROUTER:
                        clonedRequest.request.valid = routerSettingsValidator.Check(
                            clonedRequest.request.settings,
                        )
                        break
                    case ActionType.CODE: {
                        break
                    }
                }
                break
            case FlowOperationType.UPDATE_TRIGGER:
                switch (clonedRequest.request.type) {
                    case TriggerType.EMPTY:
                        clonedRequest.request.valid = false
                        break
                    case TriggerType.PIECE:
                        clonedRequest.request.valid = await validateTrigger({
                            settings: clonedRequest.request.settings,
                            projectId,
                            platformId,
                        })
                        break
                }
                break
            default:
                break
        }
        return clonedRequest
    },
}

async function validateAction({
    projectId,
    platformId,
    settings,       
}: {
    projectId: ProjectId
    platformId: PlatformId
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
        platformId,
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
    platformId,
    settings,
    projectId,
}: {
    settings: PieceTriggerSettings
    projectId: ProjectId
    platformId: PlatformId
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
        platformId,
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
                    Type.Union([Type.Null(), Type.Undefined(), Type.Never(), Type.Unknown()]),
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
                propsSchema[name] = Type.Union([Type.String({}), Type.Number({})])
                break
            case PropertyType.STATIC_DROPDOWN:
            case PropertyType.DROPDOWN:
                propsSchema[name] = nonNullableUnknownPropType
                break
            case PropertyType.BASIC_AUTH:
            case PropertyType.CUSTOM_AUTH:
            case PropertyType.SECRET_TEXT:
            case PropertyType.OAUTH2:
                propsSchema[name] = Type.Union([
                    Type.RegExp(RegExp('{{1}{connections.(.*?)}{1}}')),
                    Type.String(),
                ])
                break
            case PropertyType.ARRAY:
                propsSchema[name] = Type.Union([Type.Array(Type.Unknown({})), Type.String()])
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