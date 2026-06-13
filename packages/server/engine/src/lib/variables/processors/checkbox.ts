import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (_property, value) => {
    if (typeof value === 'boolean') {
        return value
    }
    if (value === 'true') {
        return true
    }
    if (value === 'false') {
        return false
    }
    return value
}
