import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { ApFlagId, AttributionParams, AuthenticationResponse, OtpType, SignUpMethod, TelemetryEvent, TelemetryEventName, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../flags/flag.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { SignUpContext } from './attribution/user-attribution.service'
import { authenticationUtils } from './authentication-utils'
import { authenticationService } from './authentication.service'
import { signupNames } from './lib/signup-names'
import { turnstile } from './lib/turnstile'
import { zerobounce } from './lib/zerobounce'
import { otpService } from './otp/otp-service'
import { userIdentityService } from './user-identity/user-identity-service'

export const passwordlessAuthService = (log: FastifyBaseLogger) => ({
    async requestCode({ email, platformId, captchaToken, remoteIp }: RequestCodeParams): Promise<void> {
        await turnstile.assertSolved({ token: captchaToken, remoteIp, log })
        const existingIdentity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(existingIdentity)) {
            const maySignUp = await zerobounce.maySignUp({ email, log })
            if (!maySignUp) {
                return
            }
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
            rejectedPromiseHandler(trackEmailCodeRequested({
                identityId: identity.id,
                platformId,
                isNewIdentity: isNil(existingIdentity),
                log,
            }), log)
        }
    },

    async verifyCode({ email, code, platformId, attribution }: VerifyCodeParams): Promise<VerifyCodeResult> {
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
            ? await authenticationService(log).selectCloudSignInPlatformId({ identityId: verifiedIdentity.id })
            : platformId
        rejectedPromiseHandler(trackForIdentity({
            identityId: verifiedIdentity.id,
            platformId: preferredPlatformId,
            event: {
                name: TelemetryEventName.EMAIL_CODE_VERIFIED,
                payload: { needsNameStep: isNil(preferredPlatformId) },
            },
            log,
        }), log)
        const signUp: SignUpContext = { method: SignUpMethod.EMAIL_CODE, attribution }

        if (!isNil(platformId)) {
            const mayJoin = await mayJoinPlatform({ email, platformId, identity: verifiedIdentity, log })
            if (!mayJoin) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                    params: { message: 'User is not invited to the platform' },
                })
            }
            return joinPlatform({ identity: verifiedIdentity, platformId, signUp, log })
        }

        if (!isNil(preferredPlatformId)) {
            await assertPlatformAuthIsOpenTo({ email, platformId: preferredPlatformId, log })
            return joinPlatform({ identity: verifiedIdentity, platformId: preferredPlatformId, signUp, log })
        }
        const response = await authenticationUtils(log).provisionOrOnboard({ identityId: verifiedIdentity.id, signUp })
        return { response, isNewUser: true }
    },

    async completeSignUp({ identityId, fullName, attribution }: CompleteSignUpParams): Promise<CompleteSignUpResult> {
        const identity = await userIdentityService(log).getOneOrFail({ id: identityId })
        const { firstName, lastName } = signupNames.splitFullName({ fullName, email: identity.email })
        const writeNames = async (): Promise<void> => {
            await userIdentityService(log).updateNames({ id: identityId, firstName, lastName })
        }
        const { response, provisioned } = await platformService(log).createPlatformWithProject({
            identityId,
            name: signupNames.platformNameFromSignup({ firstName, email: identity.email }),
            invalidatePreviousTokens: false,
            isFirstPlatform: true,
            callerTokenVersion: undefined,
            beforeProvision: writeNames,
            signUp: { method: SignUpMethod.EMAIL_CODE, attribution },
        })
        return { response, signedUp: provisioned }
    },
})

async function joinPlatform({ identity, platformId, signUp, log }: JoinPlatformParams): Promise<VerifyCodeResult> {
    const existingUser = await userService(log).getOneByIdentityAndPlatform({ identityId: identity.id, platformId })
    const user = await userService(log).getOrCreateWithProject({
        identity,
        platformId,
        signUp,
    })
    await userInvitationsService(log).provisionUserInvitation({ email: identity.email })
    const response = await authenticationUtils(log).getProjectAndToken({
        userId: user.id,
        platformId,
        projectId: null,
    })
    return { response, isNewUser: isNil(existingUser) }
}

async function trackEmailCodeRequested({ identityId, platformId, isNewIdentity, log }: TrackEmailCodeRequestedParams): Promise<void> {
    const preferredPlatformId = isNil(platformId)
        ? await authenticationService(log).selectCloudSignInPlatformId({ identityId })
        : platformId
    await trackForIdentity({
        identityId,
        platformId: preferredPlatformId,
        event: {
            name: TelemetryEventName.EMAIL_CODE_REQUESTED,
            payload: { isNewIdentity },
        },
        log,
    })
}

async function trackForIdentity({ identityId, platformId, event, log }: TrackForIdentityParams): Promise<void> {
    const user = isNil(platformId) ? null : await userService(log).getOneByIdentityAndPlatform({ identityId, platformId })
    if (!isNil(user) && !isNil(platformId)) {
        await telemetry(log).trackUser({ userId: user.id, platformId, event })
        return
    }
    await telemetry(log).trackIdentity({ identityId, platformId, event })
}

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

type TrackEmailCodeRequestedParams = {
    identityId: string
    platformId: string | null
    isNewIdentity: boolean
    log: FastifyBaseLogger
}

type TrackForIdentityParams = {
    identityId: string
    platformId: string | null
    event: TelemetryEvent
    log: FastifyBaseLogger
}

type JoinPlatformParams = {
    identity: UserIdentity
    platformId: string
    signUp: SignUpContext
    log: FastifyBaseLogger
}

type VerifyCodeResult = {
    response: AuthenticationResponse
    isNewUser: boolean
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
    attribution: AttributionParams | undefined
}

type VerifyCodeParams = {
    email: string
    code: string
    platformId: string | null
    attribution: AttributionParams | undefined
}

type PlatformGateParams = {
    email: string
    platformId: string
    log: FastifyBaseLogger
}

type MayJoinPlatformParams = PlatformGateParams & {
    identity: UserIdentity | null
}
