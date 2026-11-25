import { PropertyType } from '@activepieces/pieces-framework'
import { checkboxProcessor } from './checkbox'
import { dateTimeProcessor } from './date-time'
import { fileProcessor } from './file'
import { jsonProcessor } from './json'
import { multiSelectProcessor } from './multi-select'
import { numberProcessor } from './number'
import { objectProcessor } from './object'
import { staticDropdownProcessor } from './static-dropdown'
import { textProcessor } from './text'
import { ProcessorFn } from './types'

export const processors: Partial<Record<PropertyType, ProcessorFn>> = {
    JSON: jsonProcessor,
    OBJECT: objectProcessor,
    NUMBER: numberProcessor,
    LONG_TEXT: textProcessor,
    SHORT_TEXT: textProcessor,
    SECRET_TEXT: textProcessor,
    DATE_TIME: dateTimeProcessor,
    FILE: fileProcessor,
    MULTI_SELECT_DROPDOWN: multiSelectProcessor,
    STATIC_DROPDOWN: staticDropdownProcessor,
    STATIC_MULTI_SELECT_DROPDOWN: staticDropdownProcessor,
    CHECKBOX: checkboxProcessor,
}
