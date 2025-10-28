import {
    ActionBase,
    OAuth2Props,
    PiecePropertyMap,
    PropertyType,
    TriggerBase,
} from '@activepieces/pieces-framework'
import {
    isNil,
    PropertyExecutionType,
    PropertySettings,
    Step,
} from '@activepieces/shared'

export const validatePieceNameOrThrow = (pieceName: string): void => {
    if (!pieceName.startsWith('@')) {
        throw new Error('Invalid piece name. Piece names must begin with "@"')
    }
}

export const findBranchIndexFromNameInRouter = (router: Step, branchName: string): number | undefined => {
    for (let i = 0; i < router.settings.branches.length; i++) {
        if (router.settings.branches[i].branchName === branchName) {
            return i
        }
    }
    return
}

export const getDefaultPropertySettingsForActionOrTrigger = (
    actionOrTrigger: ActionBase | TriggerBase,
): Record<string, PropertySettings> => {
    return Object.fromEntries(
        Object.entries(actionOrTrigger.props).map(([key]) => [
            key,
            {
                type: PropertyExecutionType.MANUAL,
                schema: undefined,
            },
        ]),
    )
}

export const getInitalStepInputForActionOrTrigger = (
    actionOrTrigger: ActionBase | TriggerBase,
): Record<string, unknown> => {
    return getDefaultValueForStep(actionOrTrigger.props, {})
}

// Taken from form-utils.getDefaultValueForStep
function getDefaultValueForStep(
    props: PiecePropertyMap | OAuth2Props,
    existingInput: Record<string, unknown>,
    propertySettings?: Record<string, PropertySettings>,
): Record<string, unknown> {
    const defaultValues: Record<string, unknown> = {}
    const entries = Object.entries(props)
    for (const [name, property] of entries) {
        switch (property.type) {
            case PropertyType.CHECKBOX: {
                defaultValues[name] =
          existingInput[name] ?? property.defaultValue ?? false
                break
            }
            case PropertyType.ARRAY: {
                const isCustomizedArrayOfProperties =
          !isNil(propertySettings) &&
          propertySettings[name] &&
          !isNil(property.properties)
                const existingValue = existingInput[name]
                if (!isNil(existingValue)) {
                    defaultValues[name] = existingValue
                }
                else if (isCustomizedArrayOfProperties) {
                    defaultValues[name] = {}
                }
                else {
                    defaultValues[name] = property.defaultValue ?? []
                }
                break
            }
            case PropertyType.MARKDOWN:
            case PropertyType.DATE_TIME:
            case PropertyType.SHORT_TEXT:
            case PropertyType.LONG_TEXT:
            case PropertyType.FILE:
            case PropertyType.STATIC_DROPDOWN:
            case PropertyType.DROPDOWN:
            case PropertyType.BASIC_AUTH:
            case PropertyType.CUSTOM_AUTH:
            case PropertyType.SECRET_TEXT:
            case PropertyType.CUSTOM:
            case PropertyType.COLOR:
            case PropertyType.MULTI_SELECT_DROPDOWN:
            case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            case PropertyType.JSON:
            case PropertyType.NUMBER:
            case PropertyType.OAUTH2: {
                defaultValues[name] = existingInput[name] ?? property.defaultValue
                break
            }
            case PropertyType.OBJECT:
            case PropertyType.DYNAMIC:
                defaultValues[name] =
          existingInput[name] ?? property.defaultValue ?? {}
                break
        }
    }
    return defaultValues
}
