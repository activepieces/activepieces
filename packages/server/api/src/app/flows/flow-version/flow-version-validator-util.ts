import {
    PieceAuthProperty,
    piecePropertiesUtils,
    PiecePropertyMap,
} from '@activepieces/pieces-framework'
import {
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowPieceUtil,
    FlowTriggerType,
    isNil,
    LoopOnItemsActionSettings,
    PieceActionSettings,
    PieceTriggerSettings,
    PlatformId,
    RouterActionSettingsWithValidation,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'

const loopSettingsValidator = LoopOnItemsActionSettings.and(z.object({
    items: z.string().min(1),
}))
const routerSettingsValidator = RouterActionSettingsWithValidation

type ValidationResult = {
    valid: boolean
    cleanInput?: Record<string, unknown>
}

export const flowVersionValidationUtil = (log: FastifyBaseLogger) => ({
    async prepareRequest({ platformId, request, userId }: PrepareRequestParams): Promise<FlowOperationRequest> {
        const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request))

        switch (clonedRequest.type) {
            case FlowOperationType.ADD_ACTION:
                switch (clonedRequest.request.action.type) {
                    case FlowActionType.LOOP_ON_ITEMS:
                        clonedRequest.request.action.valid = loopSettingsValidator.safeParse(
                            clonedRequest.request.action.settings,
                        ).success
                        break
                    case FlowActionType.PIECE: {
                        clonedRequest.request.action.settings.pieceVersion = flowPieceUtil.getExactVersion(clonedRequest.request.action.settings.pieceVersion)
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
                        clonedRequest.request.action.valid = routerSettingsValidator.safeParse(
                            clonedRequest.request.action.settings,
                        ).success
                        break
                    case FlowActionType.CODE: {
                        break
                    }
                }
                break
            case FlowOperationType.UPDATE_ACTION:
                switch (clonedRequest.request.type) {
                    case FlowActionType.LOOP_ON_ITEMS:
                        clonedRequest.request.valid = loopSettingsValidator.safeParse(
                            clonedRequest.request.settings,
                        ).success
                        break
                    case FlowActionType.PIECE: {
                        clonedRequest.request.settings.pieceVersion = flowPieceUtil.getExactVersion(clonedRequest.request.settings.pieceVersion)
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
                        clonedRequest.request.valid = routerSettingsValidator.safeParse(
                            clonedRequest.request.settings,
                        ).success
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
                        clonedRequest.request.settings.pieceVersion = flowPieceUtil.getExactVersion(clonedRequest.request.settings.pieceVersion)
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
            case FlowOperationType.IMPORT_FLOW:{
                const notes = clonedRequest.request.notes
                if (!isNil(notes)) {
                    clonedRequest.request.notes = notes.map(note => ({
                        ...note,
                        ownerId: userId,
                    }))
                }
                break
            }
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
    const propsSchema = piecePropertiesUtils.buildSchema(props, auth, requireAuth)
    const schemaKeys = Object.keys((propsSchema as z.ZodObject<z.ZodRawShape>).shape)
    const cleanInput = !isNil(input) ? Object.fromEntries(
        schemaKeys.map(key => [key, input?.[key]]),
    ) : undefined
    return {
        valid: propsSchema.safeParse(cleanInput).success,
        cleanInput,
    }
}


type PrepareRequestParams = {
    platformId?: PlatformId
    request: FlowOperationRequest
    userId: UserId | null
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
