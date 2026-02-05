import { ApId, BaseModelSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export enum AlertChannel {
    EMAIL = 'EMAIL',
}


export const Alert = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    channel: Type.Enum(AlertChannel),
    receiver: Type.String({}),
})

export type Alert = Static<typeof Alert>