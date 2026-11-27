import { piecePropertiesUtils, PropertyType } from '@activepieces/pieces-framework'
import { multiSelectProcessor } from './multi-select'
import { ProcessorFn } from './types'

export const staticDropdownProcessor: ProcessorFn = (property, value) => {
    const parsed = property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN ? multiSelectProcessor(property, value) : value
    return piecePropertiesUtils.coerceValue({ property, value: parsed })
}
