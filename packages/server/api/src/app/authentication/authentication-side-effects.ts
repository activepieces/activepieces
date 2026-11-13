import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, AuthenticationResponse, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../helper/application-events'

export const authenticationSideEffects = (log: FastifyBaseLogger) => ({
    onSignIn({ response, signedUp, method, ip }: OnSignInParams): void {
        if (isNil(response.platformId)) {
            return
        }
        applicationEvents(log).sendUserEvent({
            platformId: response.platformId,
            userId: response.id,
            projectId: response.projectId ?? undefined,
            ip,
        }, signedUp
            ? { action: ApplicationEventName.USER_SIGNED_UP, data: { method, source: LEGACY_SIGN_UP_SOURCE[method] } }
            : { action: ApplicationEventName.USER_SIGNED_IN, data: { method } })
    },
})

const LEGACY_SIGN_UP_SOURCE: Record<UserIdentityProvider, 'credentials' | 'sso' | 'managed'> = {
    [UserIdentityProvider.EMAIL]: 'credentials',
    [UserIdentityProvider.GOOGLE]: 'sso',
    [UserIdentityProvider.SAML]: 'sso',
    [UserIdentityProvider.JWT]: 'managed',
}

type OnSignInParams = {
    response: AuthenticationResponse
    signedUp: boolean
    method: UserIdentityProvider
    ip: string
}
