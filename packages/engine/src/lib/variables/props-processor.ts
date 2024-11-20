import { InputPropertyMap, PieceAuthProperty, PiecePropertyMap, PropertyType, StaticPropsValue } from '@activepieces/pieces-framework'
import { AUTHENTICATION_PROPERTY_NAME, isNil } from '@activepieces/shared'
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
         /*
            // Short Circuit
            // If the value is required, we don't allow it to be undefined or null
            if (isNil(value) && property.required) {
                errors[key] = [
                    formatErrorMessage(ErrorMessages.REQUIRED, { userInput: value }),
                ]
                continue
            }
            // If the value is not required, we allow it to be undefined or null
            if (isNil(value) && !property.required) {
                continue
            }
*/
            // TODO URGENT FIX
            /*
            const validators = [
                ...(property.defaultValidators ?? []),
                ...(property.validators ?? []),
            ]

            const propErrors = []
            for (const validator of validators) {
                const error = validator.fn(property, processedInput[key], value)
                if (!isNil(error)) {
                    propErrors.push(error)
                }
            }
                
            if (propErrors.length) errors[key] = propErrors
            */
        }
        return { processedInput, errors }
    },
}