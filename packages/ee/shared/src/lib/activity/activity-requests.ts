import { Type, Static } from '@sinclair/typebox'
import { ApId } from '@activepieces/shared'

export const AddActivityRequestBody = Type.Object({
    projectId: ApId,
    event: Type.String(),
    message: Type.String(),
    status: Type.String(),
})

export type AddActivityRequestBody = Static<typeof AddActivityRequestBody>
