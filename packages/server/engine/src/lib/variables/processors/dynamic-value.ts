import { piecePropertiesUtils } from '@activepieces/pieces-framework'
import { ProcessorFn } from './types'

export const dynamicValueProcessor: ProcessorFn = (property, value) => {
    if (typeof value !== 'string') {
        return value
    }
    if (value.length === 0 && !property.required) {
        return undefined
    }
    return piecePropertiesUtils.parseDynamicValue({ property, value }) ?? value
}
