import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { OtpType } from './otp-type'

export type OtpId = ApId

export enum OtpState {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
}

export const OtpModel = z.object({
    ...BaseModelSchema,
    type: z.nativeEnum(OtpType),
    identityId: ApId,
    value: z.string(),
    state: z.nativeEnum(OtpState),
})

export type OtpModel = z.infer<typeof OtpModel>
