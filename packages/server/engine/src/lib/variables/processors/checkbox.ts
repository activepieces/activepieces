import { isNil, parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value) || typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return undefined
    }
    const parsed = parseToJsonIfPossible(value)
    return typeof parsed === 'boolean' ? parsed : value
}
