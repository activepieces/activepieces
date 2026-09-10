import { SignUpMethod, User, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { telemetry } from '../../helper/telemetry.utils'
import { authenticationUtils } from '../authentication-utils'
import { SignUpContext, userAttributionService } from './user-attribution.service'

export const signUpSideEffects = (log: FastifyBaseLogger) => ({
    onUserCreated({ user, identity, platformId, projectId, signUp }: OnUserCreatedParams): void {
        rejectedPromiseHandler(userAttributionService(log).record({
            userId: user.id,
            platformId,
            identityId: identity.id,
            method: signUp.method,
            attribution: signUp.attribution,
        }), log)
        if (signUp.method === SignUpMethod.MANAGED) {
            return
        }
        rejectedPromiseHandler(telemetry(log).aliasIdentity({ identityId: identity.id, userId: user.id, platformId }), log)
        rejectedPromiseHandler(authenticationUtils(log).sendTelemetry({ identity, user, projectId, signUp }), log)
    },

    onOnboardingDeferred({ identityId, signUp }: OnOnboardingDeferredParams): void {
        rejectedPromiseHandler(userAttributionService(log).record({
            userId: null,
            platformId: null,
            identityId,
            method: signUp.method,
            attribution: signUp.attribution,
        }), log)
    },
})

type OnUserCreatedParams = {
    user: User
    identity: UserIdentity
    platformId: string
    projectId: string | null
    signUp: SignUpContext
}

type OnOnboardingDeferredParams = {
    identityId: string
    signUp: SignUpContext
}
