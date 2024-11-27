import { PropertyType } from '@activepieces/pieces-framework'
import { dateTimeProcessor } from './date-time'
import { fileProcessor } from './file'
import { jsonProcessor } from './json'
import { numberProcessor } from './number'
import { objectProcessor } from './object'
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
}