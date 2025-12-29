import {
    PieceAuthProperty,
    piecePropertiesUtils,
    PiecePropertyMap,
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
    RouterActionSettingsWithValidation,
} from '@activepieces/shared'
import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'

const loopSettingsValidator = TypeCompiler.Compile(Type.Intersect([LoopOnItemsActionSettings, Type.Object({
    items: Type.String({
        minLength: 1,
    }),
})]))
const routerSettingsValidator = TypeCompiler.Compile(RouterActionSettingsWithValidation)

type ValidationResult = {
    valid: boolean
    cleanInput?: Record<string, unknown>
}

export const flowVersionValidationUtil = (log: FastifyBaseLogger) => ({
    async prepareRequest({ platformId, request }: PrepareRequestParams): Promise<FlowOperationRequest> {
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
                            { settings: clonedRequest.request.action.settings, platformId, log },
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
                            { settings: clonedRequest.request.settings, platformId, log },
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
                            { settings: clonedRequest.request.settings, platformId, log },
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

async function validateAction({ settings, platformId, log }: ValidateActionParams): Promise<ValidationResult> {
    if (
        isNil(settings.pieceName) ||
        isNil(settings.pieceVersion) ||
        isNil(settings.actionName) ||
        isNil(settings.input)
    ) {
        return { valid: false }
    }

    const piece = await pieceMetadataService(log).getOrThrow({
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

    const props = { ...action.props }
  
    return validateProps(props, settings.input, piece.auth, action.requireAuth)
}

async function validateTrigger({ settings, platformId, log }: ValidateTriggerParams): Promise<ValidationResult> {
    if (
        isNil(settings.pieceName) ||
        isNil(settings.pieceVersion) ||
        isNil(settings.triggerName) ||
        isNil(settings.input)
    ) {
        return { valid: false }
    }

    const piece = await pieceMetadataService(log).getOrThrow({
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
    const props = { ...trigger.props } 
   
    return validateProps(props, settings.input, piece.auth, trigger.requireAuth)
}

function validateProps(
    props: PiecePropertyMap,
    input: Record<string, unknown> | undefined,
    auth: PieceAuthProperty | PieceAuthProperty[] | undefined,
    //if require auth is not defined, we default to true, because at first all auth was required
    requireAuth: boolean | undefined = true,
): ValidationResult {
    const propsWithAuthSchema = piecePropertiesUtils.buildSchema(props, auth,  requireAuth)
    const inputValidator = TypeCompiler.Compile(propsWithAuthSchema)
    const cleanInput = !isNil(input) ? Object.fromEntries(
        Object.keys(propsWithAuthSchema.properties).map(key => [key, input?.[key]]),
    ) : undefined
    return {
        valid: inputValidator.Check(cleanInput),
        cleanInput,
    }
}


type PrepareRequestParams = {
    platformId?: PlatformId
    request: FlowOperationRequest
}

type ValidateActionParams = {
    settings: PieceActionSettings
    platformId?: PlatformId
    log: FastifyBaseLogger
}

type ValidateTriggerParams = {
    settings: PieceTriggerSettings
    platformId?: PlatformId
    log: FastifyBaseLogger
}
