import { isNil } from '@activepieces/core-utils'
import { piecePropertiesUtils, PropertyType } from '@activepieces/pieces-framework'
import { ProcessorFn } from './types'

export const dynamicValueProcessor: ProcessorFn = (property, value) => {
    if (typeof value === 'string' && value.trim().length === 0) {
        return property.required ? value : undefined
    }
    const parsedValue = typeof value === 'string'
        ? piecePropertiesUtils.parseDynamicValue({ property, value })
        : undefined
    if (!isNil(parsedValue)) {
        return parsedValue
    }
    const isMultiSelect = property.type === PropertyType.MULTI_SELECT_DROPDOWN
        || property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    if (!isMultiSelect || Array.isArray(value)) {
        return value
    }
    if (typeof value === 'string') {
        return isStructureLiteral(value) ? value : [value]
    }
    return typeof value === 'number' || typeof value === 'boolean' ? [value] : value
}

function isStructureLiteral(value: string): boolean {
    const trimmed = value.trimStart()
    return trimmed.startsWith('[') || trimmed.startsWith('{')
}
