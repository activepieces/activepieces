import { Static, Type } from '@sinclair/typebox';
import { ApId, BaseModelSchema } from '@activepieces/shared';
import { OtpType } from './otp-type';

export type OtpId = ApId;

export const OtpModel = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(OtpType),
    userId: ApId,
    value: Type.String(),
});

export type OtpModel = Static<typeof OtpModel>;
