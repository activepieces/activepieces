import { isNil } from '@activepieces/shared'
import { ProcessorFn } from './types'

export const jsonProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value)) {
        return value
    }
    try {
        if (typeof value === 'object') {
            return value
        }
        return JSON.parse(value)
    }
    catch (error) {
        console.error(error)
        return undefined
    }
}