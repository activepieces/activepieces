import { getAuthPropertyForValue, InputPropertyMap, PieceAuthProperty, PieceProperty, PiecePropertyMap, PropertyType, StaticPropsValue } from '@activepieces/pieces-framework'
import { AppConnectionValue, AUTHENTICATION_PROPERTY_NAME, isNil, isObject, PropertySettings } from '@activepieces/shared'
import { processors } from './processors'
import { arrayZipperProcessor } from './processors/array-zipper'

type PropsValidationError = {
    [key: string]: string[] | PropsValidationError | PropsValidationError[]
}

export const propsProcessor = {
    applyProcessorsAndValidators: async (
        resolvedInput: StaticPropsValue<PiecePropertyMap>,
        props: InputPropertyMap,
        auth: PieceAuthProperty | PieceAuthProperty[] | undefined,
        requireAuth: boolean,
        propertySettings: Record<string, PropertySettings>,
    ): Promise<{ processedInput: StaticPropsValue<PiecePropertyMap>, errors: PropsValidationError }> => {
        let dynamaicPropertiesSchema: Record<string, InputPropertyMap> | undefined = undefined
        if (Object.keys(propertySettings).length > 0) {
            dynamaicPropertiesSchema = Object.fromEntries(Object.entries(propertySettings).map(([key, propertySetting]) => [key, propertySetting.schema]))
        }
        const processedInput = { ...resolvedInput }
        const errors: PropsValidationError = {}
        const authValue: AppConnectionValue | undefined = resolvedInput[AUTHENTICATION_PROPERTY_NAME]
        if (authValue && requireAuth) {
            const authPropsToProcess = getAuthPropsToProcess(authValue, auth)
            if (authPropsToProcess) {
                const { processedInput: authProcessedInput, errors: authErrors } = await propsProcessor.applyProcessorsAndValidators(
                    resolvedInput[AUTHENTICATION_PROPERTY_NAME],
                    authPropsToProcess,
                    undefined,
                    false,
                    {},
                )
                processedInput[AUTHENTICATION_PROPERTY_NAME] = authProcessedInput
                if (Object.keys(authErrors).length > 0) {
                    errors[AUTHENTICATION_PROPERTY_NAME] = authErrors
                }
            }
        }
        for (const [key, value] of Object.entries(resolvedInput)) {
            const property = props[key]
            if (isNil(property)) {
                continue
            }
            if (property.type === PropertyType.DYNAMIC && !isNil(dynamaicPropertiesSchema?.[key])) {
                const { processedInput: itemProcessedInput, errors: itemErrors } = await propsProcessor.applyProcessorsAndValidators(
                    value,
                    dynamaicPropertiesSchema[key],
                    undefined,
                    false,
                    {},
                )
                processedInput[key] = itemProcessedInput
                if (Object.keys(itemErrors).length > 0) {
                    errors[key] = itemErrors
                }
            }
            if (property.type === PropertyType.ARRAY && property.properties) {
                const arrayOfObjects = arrayZipperProcessor(property, value) ?? []
                const processedArray = []
                const processedErrors = []
                for (const item of arrayOfObjects) {
                    const { processedInput: itemProcessedInput, errors: itemErrors } = await propsProcessor.applyProcessorsAndValidators(
                        item,
                        property.properties,
                        undefined,
                        false,
                        {},
                    )
                    processedArray.push(itemProcessedInput)
                    processedErrors.push(itemErrors)
                }
                processedInput[key] = processedArray
                const isThereErrors = processedErrors.some(error => Object.keys(error).length > 0)
                if (isThereErrors) {
                    errors[key] = {
                        properties: processedErrors,
                    }
                }
            }
            const processor = processors[property.type]
            if (processor) {
                processedInput[key] = await processor(property, processedInput[key])
            }

            const shouldValidate = key !== AUTHENTICATION_PROPERTY_NAME && property.type !== PropertyType.MARKDOWN
            if (!shouldValidate) {
                continue
            }
        }

        for (const [key, value] of Object.entries(processedInput)) {
            const property = props[key]
            if (isNil(property)) {
                continue
            }

            const validationErrors = validateProperty(property, value, resolvedInput[key])
            if (validationErrors.length > 0) {
                errors[key] = validationErrors
            }
        }

        return { processedInput, errors }
    },
}

const validateProperty = (property: PieceProperty, value: unknown, originalValue: unknown): string[] => {
    if (property.type === PropertyType.JSON) {
        // non-JSON strings are passed through as-is (e.g. XML or plain-text HTTP bodies), so only reject missing required values
        const isMissing = isNil(value) || value === ''
        if (property.required && isMissing) {
            return [`Expected JSON, received: ${originalValue}`]
        }
        return []
    }

    if (!property.required && isNil(value)) {
        return []
    }

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
            return typeof value === 'string' ? [] : [`Expected string, received: ${originalValue}`]
        case PropertyType.NUMBER:
            return typeof value === 'number' && !Number.isNaN(value) ? [] : [`Expected number, received: ${originalValue}`]
        case PropertyType.CHECKBOX:
            return typeof value === 'boolean' ? [] : [`Expected boolean, received: ${originalValue}`]
        case PropertyType.DATE_TIME:
            return typeof value === 'string' ? [] : [`Invalid datetime format. Expected ISO format (e.g. 2024-03-14T12:00:00.000Z), received: ${originalValue}`]
        case PropertyType.ARRAY:
            return Array.isArray(value) ? [] : [`Expected array, received: ${originalValue}`]
        case PropertyType.OBJECT:
            return isObject(value) ? [] : [`Expected object, received: ${originalValue}`]
        case PropertyType.FILE:
            return isObject(value) ? [] : [`Expected file url or base64 with mimeType, received: ${originalValue}`]
        default:
            return []
    }
}

function getAuthPropsToProcess(authValue: AppConnectionValue, auth: PieceAuthProperty | PieceAuthProperty[] | undefined): | null {
    if (isNil(auth)) {
        return null
    }
    const usedAuthProperty = getAuthPropertyForValue({
        authValueType: authValue.type,
        pieceAuth: auth,
    })
    const doesAuthHaveProps = usedAuthProperty?.type === PropertyType.CUSTOM_AUTH || usedAuthProperty?.type === PropertyType.OAUTH2
    if (doesAuthHaveProps && !isNil(usedAuthProperty?.props)) {
        return usedAuthProperty.props
    }
    return null
}