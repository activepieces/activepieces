import { isDehydratedRef } from '@activepieces/shared'
import { utils } from '../utils'

export const recursiveSizeof = (value: unknown): number => {
    if (value === null || value === undefined) {
        return utils.sizeof(value)
    }
    if (isDehydratedRef(value)) {
        return value.size
    }
    if (Array.isArray(value)) {
        let total = 2
        for (const item of value) {
            total += recursiveSizeof(item) + 1
        }
        return total
    }
    if (typeof value === 'object') {
        let total = 2
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            total += utils.sizeof(key) + 1 + recursiveSizeof(child) + 1
        }
        return total
    }
    return utils.sizeof(value)
}
