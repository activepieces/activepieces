import { isNil } from '@activepieces/shared'
import { ProcessorFn } from './types'

export const textProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value)) {
        return value
    }
    if (typeof value === 'object') {
        return JSON.stringify(value)
    }
    return value.toString()
}