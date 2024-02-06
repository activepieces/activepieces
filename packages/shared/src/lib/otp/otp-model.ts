import { Static, Type } from '@sinclair/typebox';
import { BaseModelSchema } from "../common"
import { OtpType } from './otp-type';
import { ApId } from "../common/id-generator";

export type OtpId = ApId;

export enum OtpState {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
}

export const OtpModel = Type.Object({
    ...BaseModelSchema,
    type: Type.Enum(OtpType),
    userId: ApId,
    value: Type.String(),
    state: Type.Enum(OtpState),
});

export type OtpModel = Static<typeof OtpModel>;
