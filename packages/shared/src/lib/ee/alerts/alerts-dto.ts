import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
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