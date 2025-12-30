import { ApId, BaseModelSchema } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export type OtpId = ApId

enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}


export enum OtpState {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
}

export const OtpModel = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(OtpType),
    identityId: ApId,
    value: Type.String(),
    state: Type.Enum(OtpState),
})

export type OtpModel = Static<typeof OtpModel>
