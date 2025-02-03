import { isObject } from '@activepieces/shared'
import { ProcessorFn } from './types'

function getLongestArrayLengthInObject(props: Record<string, unknown>): number {
    return Math.max(
        ...Object.values(props).map(value =>
            Array.isArray(value) ? value.length : 1,
        ),
    )
}

function constructResultForIndex(props: Record<string, unknown>, index: number): Record<string, unknown> {
    return Object.entries(props).reduce((result, [key, value]) => {
        result[key] = Array.isArray(value) ? value[index] : value
        return result
    }, {} as Record<string, unknown>)
}

export const arrayZipperProcessor: ProcessorFn = (_property, value) => {
    if (Array.isArray(value) || !isObject(value)) {
        return value
    }
  
    return Array.from({ length: getLongestArrayLengthInObject(value) },
        (_, index) => constructResultForIndex(value, index),
    )
}
