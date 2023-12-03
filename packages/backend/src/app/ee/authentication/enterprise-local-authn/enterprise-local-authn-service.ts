import { UserId, ActivepiecesError, ErrorCode, AuthenticationResponse, UserStatus, User } from '@activepieces/shared'
import { OtpType, ResetPasswordRequestBody, VerifyEmailRequestBody } from '@activepieces/ee-shared'
import { userService } from '../../../user/user-service'
import { otpService } from '../../otp/otp-service'
import { projectMemberService } from '../../project-members/project-member.service'
import { QueryFailedError } from 'typeorm'
import { authenticationService } from '../../../authentication/authentication-service'

export const enterpriseLocalAuthnService = {
    async verifyEmail({ userId, otp }: VerifyEmailRequestBody): Promise<void> {
        await confirmOtp({
            userId,
            otp,
            otpType: OtpType.EMAIL_VERIFICATION,
        })

        await userService.verify({ id: userId })
    },

    async resetPassword({ userId, otp, newPassword }: ResetPasswordRequestBody): Promise<void> {
        await confirmOtp({
            userId,
            otp,
            otpType: OtpType.PASSWORD_RESET,
        })

        await userService.updatePassword({
            id: userId,
            newPassword,
        })
    },

    async signUpAndAcceptInvitation(params: SignUpAndAcceptParams): Promise<AuthenticationResponse> {
        const projectMember = await projectMemberService.getByInvitationTokenOrThrow(params.invitationToken)

        const user = await createUser({
            email: projectMember.email,
            platformId: projectMember.platformId,
            password: params.password,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: params.trackEvents,
            newsLetter: params.newsLetter,
            status: UserStatus.VERIFIED,
        })

        await projectMemberService.accept({
            invitationToken: params.invitationToken,
            userId: user.id,
        })

        return authenticationService.signUpResponse({
            user,
        })
    },
}

const confirmOtp = async ({ userId, otp, otpType }: ConfirmOtpParams): Promise<void> => {
    const isOtpValid = await otpService.confirm({
        userId,
        type: otpType,
        value: otp,
    })

    if (!isOtpValid) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_OTP,
            params: {},
        })
    }
}

const createUser = async (params: CreateUserParams): Promise<User> => {
    try {
        const newUser: NewUser = {
            email: params.email,
            status: params.status,
            firstName: params.firstName,
            lastName: params.lastName,
            trackEvents: params.trackEvents,
            newsLetter: params.newsLetter,
            password: params.password,
            platformId: params.platformId,
        }

        return await userService.create(newUser)
    }
    catch (e: unknown) {
        if (e instanceof QueryFailedError) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email: params.email,
                    platformId: params.platformId,
                },
            })
        }

        throw e
    }
}

type NewUser = Omit<User, 'id' | 'created' | 'updated'>

type ConfirmOtpParams = {
    userId: UserId
    otp: string
    otpType: OtpType
}

type SignUpAndAcceptParams = {
    firstName: string
    lastName: string
    password: string
    trackEvents: boolean
    newsLetter: boolean
    invitationToken: string
}

type CreateUserParams = {
    email: string
    password: string
    firstName: string
    lastName: string
    trackEvents: boolean
    newsLetter: boolean
    status: UserStatus
    platformId: string | null
    referringUserId?: string
}
