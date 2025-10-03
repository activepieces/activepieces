import {
    PiecePropertyMap,
    PropertyType,
} from '@activepieces/pieces-framework'
import {
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    FlowTriggerType,
    isNil,
    LoopOnItemsActionSettings,
    PieceActionSettings,
    PieceTriggerSettings,
    PlatformId,
    ProjectId,
    PropertyExecutionType,
    RouterActionSettingsValidation,
    PropertySettings,
} from '@activepieces/shared'
import { TSchema, Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'

const loopSettingsValidator = TypeCompiler.Compile(Type.Intersect([LoopOnItemsActionSettings, Type.Object({
    items: Type.String({
        minLength: 1,
    }),
})]))
const routerSettingsValidator = TypeCompiler.Compile(RouterActionSettingsValidation)

type ValidationResult = {
    valid: boolean
    cleanInput?: Record<string, unknown>
}

export const flowVersionValidationUtil = (log: FastifyBaseLogger) => ({
    async prepareRequest(
        projectId: ProjectId,
        platformId: PlatformId,
        request: FlowOperationRequest,
    ): Promise<FlowOperationRequest> {
        const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request))

        switch (clonedRequest.type) {
            case FlowOperationType.ADD_ACTION:
                switch (clonedRequest.request.action.type) {
                    case FlowActionType.LOOP_ON_ITEMS:
                        clonedRequest.request.action.valid = loopSettingsValidator.Check(
                            clonedRequest.request.action.settings,
                        ) 
                        break
                    case FlowActionType.PIECE: {
                        const result = await validateAction(
                            clonedRequest.request.action.settings,
                            projectId,
                            platformId,
                            log,
                        )
                        clonedRequest.request.action.valid = result.valid
                        if (!isNil(result.cleanInput)) {
                            clonedRequest.request.action.settings.input = result.cleanInput
                        }
                        break
                    }
                    case FlowActionType.ROUTER:
                        clonedRequest.request.action.valid = routerSettingsValidator.Check(
                            clonedRequest.request.action.settings,
                        )
                        break
                    case FlowActionType.CODE: {
                        break
                    }
                }
                break
            case FlowOperationType.UPDATE_ACTION:
                switch (clonedRequest.request.type) {
                    case FlowActionType.LOOP_ON_ITEMS:
                        clonedRequest.request.valid = loopSettingsValidator.Check(
                            clonedRequest.request.settings,
                        )
                        break
                    case FlowActionType.PIECE: {
                        const result = await validateAction(
                            clonedRequest.request.settings,
                            projectId,
                            platformId,
                            log,
                        )
                        clonedRequest.request.valid = result.valid
                        if (!isNil(result.cleanInput)) {
                            clonedRequest.request.settings.input = result.cleanInput
                        }
                        break
                    }
                    case FlowActionType.ROUTER:
                        clonedRequest.request.valid = routerSettingsValidator.Check(
                            clonedRequest.request.settings,
                        )
                        break
                    case FlowActionType.CODE: {
                        break
                    }
                }
                break
            case FlowOperationType.UPDATE_TRIGGER:
                switch (clonedRequest.request.type) {
                    case FlowTriggerType.EMPTY:
                        clonedRequest.request.valid = false
                        break
                    case FlowTriggerType.PIECE: {
                        const result = await validateTrigger(
                            clonedRequest.request.settings,
                            projectId,
                            platformId,
                            log,
                        )
                        clonedRequest.request.valid = result.valid
                        if (result.valid && result.cleanInput) {
                            clonedRequest.request.settings.input = result.cleanInput
                        }
                        break
                    }
                }
                break
            default:
                break
        }
        return clonedRequest
    },
})

async function validateAction(
    settings: PieceActionSettings,
    projectId: ProjectId,
    platformId: PlatformId,
    log: FastifyBaseLogger,
): Promise<ValidationResult> {
    if (
        isNil(settings.pieceName) ||
        isNil(settings.pieceVersion) ||
        isNil(settings.actionName) ||
        isNil(settings.input)
    ) {
        return { valid: false }
    }

    const piece = await pieceMetadataService(log).getOrThrow({
        projectId,
        platformId,
        name: settings.pieceName,
        version: settings.pieceVersion,
    })

    if (isNil(piece)) {
        return { valid: false }
    }

    const action = piece.actions[settings.actionName]
    if (isNil(action)) {
        return { valid: false }
    }

    const props = action.props
    if (!isNil(piece.auth) && action.requireAuth !== false) {
        props.auth = piece.auth
    }
    return validateProps(props, settings.input, settings.propertySettings)
}

async function validateTrigger(
    settings: PieceTriggerSettings,
    projectId: ProjectId,
    platformId: PlatformId,
    log: FastifyBaseLogger,
): Promise<ValidationResult> {
    if (
        isNil(settings.pieceName) ||
        isNil(settings.pieceVersion) ||
        isNil(settings.triggerName) ||
        isNil(settings.input)
    ) {
        return { valid: false }
    }

    const piece = await pieceMetadataService(log).getOrThrow({
        projectId,
        platformId,
        name: settings.pieceName,
        version: settings.pieceVersion,
    })
    if (isNil(piece)) {
        return { valid: false }
    }
    const trigger = piece.triggers[settings.triggerName]
    if (isNil(trigger)) {
        return { valid: false }
    }
    const props = trigger.props
    if (!isNil(piece.auth) && trigger.requireAuth !== false) {
        props.auth = piece.auth
    }
    return validateProps(props, settings.input, settings.propertySettings)
}

function validateProps(
    props: PiecePropertyMap,
    input: Record<string, unknown> | undefined,
    propertySettings: Record<string, PropertySettings>,
): ValidationResult {
    const propsSchema = buildSchema(props, propertySettings)
    const propsValidator = TypeCompiler.Compile(propsSchema)
    const valid = propsValidator.Check(input)
    const cleanInput = !isNil(input) ? Object.fromEntries(
        Object.keys(props).map(key => [key, input?.[key]]),
    ) : undefined

    return {
        valid,
        cleanInput,
    }
}

function buildSchema(props: PiecePropertyMap, propertySettings: Record<string, PropertySettings>): TSchema {
    const entries = Object.entries(props)
    const nonNullableUnknownPropType = Type.Not(
        Type.Union([Type.Null(), Type.Undefined()]),
        Type.Unknown(),
    )
    const propsSchema: Record<string, TSchema> = {}
    for (const [name, property] of entries) {
        const propertySetting = propertySettings[name]
        
        if (propertySetting?.type === PropertyExecutionType.AUTO) {
            propsSchema[name] = Type.Optional(
                Type.Union([
                  Type.Null(),
                  Type.Undefined(),
                  Type.Never(),
                  Type.Unknown(),
                ]),
              );
            continue
        }

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
            case PropertyType.COLOR:
                propsSchema[name] = Type.String()
                break
            case PropertyType.ARRAY:
                propsSchema[name] = Type.Union([Type.Array(Type.Unknown({})), Type.String(), Type.Record(Type.String(), Type.Unknown())])
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
            case PropertyType.CUSTOM:
                propsSchema[name] = Type.Unknown()
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