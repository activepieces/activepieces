import { InputPropertyMap, PieceAuthProperty, PieceProperty, PiecePropertyMap, PropertyType, StaticPropsValue } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, isNil, isObject } from '@activepieces/shared'
import { z } from 'zod'
import { processors } from './processors'



type PropsValidationError = {
    [key: string]: string[] | PropsValidationError | PropsValidationError[]
}

export const propsProcessor = {
    applyProcessorsAndValidators: async (
        resolvedInput: StaticPropsValue<PiecePropertyMap>,
        props: InputPropertyMap,
        auth: PieceAuthProperty | undefined,
        requireAuth: boolean,
    ): Promise<{ processedInput: StaticPropsValue<PiecePropertyMap>, errors: PropsValidationError }> => {
        const processedInput = { ...resolvedInput }
        const errors: PropsValidationError = {}

        const isAuthenticationProperty = auth && (auth.type === PropertyType.CUSTOM_AUTH || auth.type === PropertyType.OAUTH2) && !isNil(auth.props) && requireAuth
        if (isAuthenticationProperty) {
            const { processedInput: authProcessedInput, errors: authErrors } = await propsProcessor.applyProcessorsAndValidators(
                resolvedInput[AUTHENTICATION_PROPERTY_NAME],
                auth.props,
                undefined,
                requireAuth,
            )
            processedInput.auth = authProcessedInput
            if (Object.keys(authErrors).length > 0) {
                errors.auth = authErrors
            }
        }

        for (const [key, value] of Object.entries(resolvedInput)) {
            const property = props[key]
            if (isNil(property)) {
                continue
            }
            if (property.type === PropertyType.ARRAY && property.properties) {
                const arrayOfObjects = value
                const processedArray = []
                const processedErrors = []
                for (const item of arrayOfObjects) {
                    const { processedInput: itemProcessedInput, errors: itemErrors } = await propsProcessor.applyProcessorsAndValidators(
                        item,
                        property.properties,
                        undefined,
                        false,
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
                processedInput[key] = await processor(property, value)
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
    let schema
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
            schema = z.string({
                required_error: `Expected string, received: ${originalValue}`,
                invalid_type_error: `Expected string, received: ${originalValue}`,
            })
            break
        case PropertyType.NUMBER:
            schema = z.number({
                required_error: `Expected number, received: ${originalValue}`,
                invalid_type_error: `Expected number, received: ${originalValue}`,
            })
            break
        case PropertyType.CHECKBOX:
            schema = z.boolean({
                required_error: `Expected boolean, received: ${originalValue}`,
                invalid_type_error: `Expected boolean, received: ${originalValue}`,
            })
            break
        case PropertyType.DATE_TIME:
            schema = z.string({
                required_error: `Invalid datetime format. Expected ISO format (e.g. 2024-03-14T12:00:00.000Z), received: ${originalValue}`,
                invalid_type_error: `Invalid datetime format. Expected ISO format (e.g. 2024-03-14T12:00:00.000Z), received: ${originalValue}`,
            })
            break
        case PropertyType.ARRAY:
            schema = z.array(z.any(), {
                required_error: `Expected array, received: ${originalValue}`,
                invalid_type_error: `Expected array, received: ${originalValue}`,
            })
            break
        case PropertyType.OBJECT:
            schema = z.record(z.any(), {
                required_error: `Expected object, received: ${originalValue}`,
                invalid_type_error: `Expected object, received: ${originalValue}`,
            })
            break
        case PropertyType.JSON:
            schema = z.any().refine(
                (val) => isObject(val) || Array.isArray(val),
                {
                    message: `Expected JSON, received: ${originalValue}`,
                },
            )
            break
        case PropertyType.FILE:
            schema = z.record(z.any(), {
                required_error: `Expected file url or base64 with mimeType, received: ${originalValue}`,
                invalid_type_error: `Expected file url or base64 with mimeType, received: ${originalValue}`,
            })
            break
        default:
            schema = z.any()
    }
    let finalSchema
    if (property.required) {
        finalSchema = schema
    }
    else {
        finalSchema = schema.nullable().optional()
    }

    try {
        finalSchema.parse(value)
        return []
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return err.errors.map(e => e.message)
        }
        return []
    }
}