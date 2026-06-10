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
    catch {
        // non-JSON text (e.g. an XML or plain-text HTTP body) is passed through as-is
        return value
    }
}