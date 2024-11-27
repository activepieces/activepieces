import { isNil } from '@activepieces/shared'
import { ProcessorFn } from './types'

export const objectProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value)) {
        return value
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value
    }
    return undefined
}