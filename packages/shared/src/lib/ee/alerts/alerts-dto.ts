import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'

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