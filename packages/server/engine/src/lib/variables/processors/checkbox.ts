import { parseToJsonIfPossible } from '@activepieces/core-utils'
import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (_property, value) => {
    if (typeof value !== 'string') {
        return value
    }
    const parsed = parseToJsonIfPossible(value)
    return typeof parsed === 'boolean' ? parsed : value
}
