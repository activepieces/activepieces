import { ApId } from '../../../core/common/id-generator'
import { SignUpRequest } from '../../../core/authentication/dto/sign-up-request'
import { Static, Type } from '@sinclair/typebox'

export const VerifyEmailRequestBody = Type.Object({
    identityId: ApId,
    otp: Type.String(),
})
export type VerifyEmailRequestBody = Static<typeof VerifyEmailRequestBody>

export const ResetPasswordRequestBody = Type.Object({
    identityId: ApId,
    otp: Type.String(),
    newPassword: Type.String(),
})
export type ResetPasswordRequestBody = Static<typeof ResetPasswordRequestBody>

export const SignUpAndAcceptRequestBody = Type.Composite([
    Type.Omit(SignUpRequest, ['referringUserId', 'email']),
    Type.Object({
        invitationToken: Type.String(),
    }),
])

export type SignUpAndAcceptRequestBody = Static<typeof SignUpAndAcceptRequestBody>

