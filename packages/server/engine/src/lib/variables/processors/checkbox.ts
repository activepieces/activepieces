import { parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (property, value) => {
    if (typeof value !== 'string') {
        return value
    }
    if (value.length === 0 && !property.required) {
        return undefined
    }
    const parsed = parseToJsonIfPossible(value)
    return typeof parsed === 'boolean' ? parsed : value
}
