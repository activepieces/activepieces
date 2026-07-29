import { isNil, parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const multiSelectProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value)) {
        return value
    }
    if (Array.isArray(value)) {
        return value
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return undefined
    }
    const parsed = typeof value === 'string' ? parseToJsonIfPossible(value) : value
    return Array.isArray(parsed) ? parsed : [value]
}
