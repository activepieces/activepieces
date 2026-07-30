import { isNil, parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const multiSelectProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value) || Array.isArray(value)) {
        return value
    }
    if (typeof value === 'string' && value.trim().length === 0) {
        return undefined
    }
    const parsed = parseToJsonIfPossible(value)
    return Array.isArray(parsed) ? parsed : [value]
}
