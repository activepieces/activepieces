import { parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const multiSelectProcessor: ProcessorFn = (_property, value) => {
    if (typeof value !== 'string') {
        return value
    }
    const parsed = parseToJsonIfPossible(value)
    return Array.isArray(parsed) ? parsed : value
}
