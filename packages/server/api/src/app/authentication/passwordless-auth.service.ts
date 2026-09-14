import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { ApFlagId, AuthenticationResponse, OtpType, TelemetryEvent, TelemetryEventName, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../flags/flag.service'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { AuthenticationResult, authenticationUtils } from './authentication-utils'
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

    async verifyCode({ email, code, platformId }: VerifyCodeParams): Promise<AuthenticationResult> {
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

        if (!isNil(platformId)) {
            const mayJoin = await mayJoinPlatform({ email, platformId, identity: verifiedIdentity, log })
            if (!mayJoin) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                    params: { message: 'User is not invited to the platform' },
                })
            }
            const { user, created } = await userService(log).getOrCreateWithProject({
                identity: verifiedIdentity,
                platformId,
            })
            rejectedPromiseHandler(telemetry(log).aliasIdentity({ identityId: verifiedIdentity.id, userId: user.id, platformId }), log)
            await userInvitationsService(log).provisionUserInvitation({ email })
            const response = await authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId,
                projectId: null,
            })
            return { response, signedUp: created }
        }

        if (!isNil(preferredPlatformId)) {
            await assertPlatformAuthIsOpenTo({ email, platformId: preferredPlatformId, log })
            const { user, created } = await userService(log).getOrCreateWithProject({
                identity: verifiedIdentity,
                platformId: preferredPlatformId,
            })
            rejectedPromiseHandler(telemetry(log).aliasIdentity({ identityId: verifiedIdentity.id, userId: user.id, platformId: preferredPlatformId }), log)
            const response = await authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId: preferredPlatformId,
                projectId: null,
            })
            return { response, signedUp: created }
        }
        return authenticationUtils(log).provisionOrOnboard({ identityId: verifiedIdentity.id })
    },

    async completeSignUp({ identityId, fullName }: CompleteSignUpParams): Promise<AuthenticationResult & { provider: UserIdentityProvider }> {
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
        })
        return { response, signedUp: provisioned, provider: identity.provider }
    },
})

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

type RequestCodeParams = {
    email: string
    platformId: string | null
    captchaToken: string | undefined
    remoteIp: string | undefined
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
