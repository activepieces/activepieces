import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { ApFlagId, AuthenticationResponse, OtpType, TelemetryEventName, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../flags/flag.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationUtils } from './authentication-utils'
import { authenticationService } from './authentication.service'
import { disposableEmail } from './lib/disposable-email'
import { signupNames } from './lib/signup-names'
import { turnstile } from './lib/turnstile'
import { otpService } from './otp/otp-service'
import { userIdentityService } from './user-identity/user-identity-service'

export const passwordlessAuthService = (log: FastifyBaseLogger) => ({
    async requestCode({ email, platformId, captchaToken, remoteIp }: RequestCodeParams): Promise<void> {
        await turnstile.assertSolved({ token: captchaToken, remoteIp, log })
        const existingIdentity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(existingIdentity)) {
            await disposableEmail.assertMaySignUp({ email, log })
        }
        if (!isNil(platformId)) {
            await assertPlatformAuthIsOpenTo({ email, platformId, log })
            const mayJoin = await mayJoinPlatform({ email, platformId, identity: existingIdentity, log })
            if (!mayJoin) {
                return
            }
        }
        if (isNil(existingIdentity)) {
            await userIdentityService(log).create({
                email,
                password: await cryptoUtils.generateRandomPassword(),
                firstName: signupNames.firstNameFromEmail(email),
                lastName: '',
                trackEvents: true,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: false,
            })
        }
        await otpService(log).createAndSend({
            platformId,
            email,
            type: OtpType.EMAIL_LOGIN,
        })
        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (!isNil(identity)) {
            rejectedPromiseHandler(telemetry(log).trackIdentity(identity.id, {
                name: TelemetryEventName.EMAIL_CODE_REQUESTED,
                payload: { isNewIdentity: isNil(existingIdentity) },
            }), log)
        }
    },

    async verifyCode({ email, code, platformId }: VerifyCodeParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_OTP, params: {} })
        }
        if (!isNil(platformId)) {
            await assertPlatformAuthIsOpenTo({ email, platformId, log })
        }
        const codeIsValid = await otpService(log).confirm({
            identityId: identity.id,
            type: OtpType.EMAIL_LOGIN,
            value: code,
        })
        if (!codeIsValid) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_OTP, params: {} })
        }
        const verifiedIdentity = identity.verified ? identity : await userIdentityService(log).verifyAndDiscardPassword(identity.id)
        await flagService(log).save({ id: ApFlagId.USER_CREATED, value: true })

        const preferredPlatformId = isNil(platformId)
            ? await authenticationService(log).resolvePreferredPlatformId({ identityId: verifiedIdentity.id })
            : platformId
        rejectedPromiseHandler(telemetry(log).trackIdentity(verifiedIdentity.id, {
            name: TelemetryEventName.EMAIL_CODE_VERIFIED,
            payload: { needsNameStep: isNil(preferredPlatformId) },
        }), log)

        if (!isNil(platformId)) {
            const mayJoin = await mayJoinPlatform({ email, platformId, identity: verifiedIdentity, log })
            if (!mayJoin) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                    params: { message: 'User is not invited to the platform' },
                })
            }
            const user = await userService(log).getOrCreateWithProject({
                identity: verifiedIdentity,
                platformId,
            })
            await userInvitationsService(log).provisionUserInvitation({ email })
            return authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId,
                projectId: null,
            })
        }

        if (!isNil(preferredPlatformId)) {
            await assertPlatformAuthIsOpenTo({ email, platformId: preferredPlatformId, log })
            const user = await userService(log).getOrCreateWithProject({
                identity: verifiedIdentity,
                platformId: preferredPlatformId,
            })
            return authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId: preferredPlatformId,
                projectId: null,
            })
        }
        return authenticationUtils(log).getOnboardingResponse({ identityId: verifiedIdentity.id })
    },

    async completeSignUp({ identityId, fullName }: CompleteSignUpParams): Promise<CompleteSignUpResult> {
        const identity = await userIdentityService(log).getOneOrFail({ id: identityId })
        const { firstName, lastName } = signupNames.splitFullName({ fullName, email: identity.email })
        const writeNames = async (): Promise<void> => {
            await userIdentityService(log).updateNames({ id: identityId, firstName, lastName })
        }
        const { response, provisioned } = await platformService(log).createPlatformWithProject({
            identityId,
            name: signupNames.platformNameFromPerson({ firstName, email: identity.email }),
            invalidatePreviousTokens: false,
            isFirstPlatform: true,
            callerTokenVersion: undefined,
            beforeProvision: writeNames,
        })
        return { response, signedUp: provisioned }
    },
})

async function assertPlatformAuthIsOpenTo({ email, platformId, log }: PlatformGateParams): Promise<void> {
    await authenticationUtils(log).assertEmailAuthIsEnabled({
        platformId,
        provider: UserIdentityProvider.EMAIL,
    })
    await authenticationUtils(log).assertDomainIsAllowed({ email, platformId })
}

async function mayJoinPlatform({ email, platformId, identity, log }: MayJoinPlatformParams): Promise<boolean> {
    if (system.get(AppSystemProp.ALLOW_OPEN_SIGN_UP) === 'true') {
        return true
    }
    const isExistingMember = !isNil(identity)
        && !isNil(await userService(log).getOneByIdentityAndPlatform({ identityId: identity.id, platformId }))
    if (isExistingMember) {
        return true
    }
    return userInvitationsService(log).hasAnyAcceptedInvitations({ platformId, email })
}

type RequestCodeParams = {
    email: string
    platformId: string | null
    captchaToken: string | undefined
    remoteIp: string | undefined
}

type CompleteSignUpResult = {
    response: AuthenticationResponse
    signedUp: boolean
}

type CompleteSignUpParams = {
    identityId: string
    fullName: string
}

type VerifyCodeParams = {
    email: string
    code: string
    platformId: string | null
}

type PlatformGateParams = {
    email: string
    platformId: string
    log: FastifyBaseLogger
}

type MayJoinPlatformParams = PlatformGateParams & {
    identity: UserIdentity | null
}
