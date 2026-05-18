import { z } from 'zod'
import { Metadata } from '../../../core/common/metadata'
import { VARIABLE_NAME_REGEX } from '../variable'

export const UpsertVariableRequestBody = z.object({
    projectId: z.string(),
    name: z.string().min(1, 'formErrors.required').regex(VARIABLE_NAME_REGEX, 'invalidVariableName'),
    value: z.string().min(1, 'formErrors.required'),
    metadata: Metadata.optional(),
})
export type UpsertVariableRequestBody = z.infer<typeof UpsertVariableRequestBody>

export const UpdateVariableRequestBody = z.object({
    metadata: Metadata.optional(),
})
export type UpdateVariableRequestBody = z.infer<typeof UpdateVariableRequestBody>
