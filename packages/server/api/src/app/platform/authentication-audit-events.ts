import { isNil } from '@activepieces/core-utils'
import { ApplicationEventName, AuthenticationDomainEvent, AuthenticationSettingEvent, Platform, PlatformWithoutFederatedAuth, SAMLAuthnProviderConfig, SsoDomainVerificationStatus } from '@activepieces/shared'
import deepEqual from 'deep-equal'

function buildAuthenticationEvents({ before, after }: AuthenticationEventsParams): AuthenticationAuditEventParams[] {
    return [
        ...toggleEvents({
            previous: before.emailAuthEnabled,
            next: after.emailAuthEnabled,
            enabledAction: ApplicationEventName.EMAIL_SIGN_IN_ENABLED,
            disabledAction: ApplicationEventName.EMAIL_SIGN_IN_DISABLED,
        }),
        ...toggleEvents({
            previous: before.googleAuthEnabled,
            next: after.googleAuthEnabled,
            enabledAction: ApplicationEventName.GOOGLE_SIGN_IN_ENABLED,
            disabledAction: ApplicationEventName.GOOGLE_SIGN_IN_DISABLED,
        }),
        ...allowedDomainEvents({ before, after }),
        ...ssoDomainEvents({ before, after }),
        ...samlEvents({ before, after }),
    ]
}

function toggleEvents({ previous, next, enabledAction, disabledAction }: ToggleEventsParams): AuthenticationAuditEventParams[] {
    if (previous === next) {
        return []
    }
    return [{ action: next ? enabledAction : disabledAction, data: {} }]
}

function allowedDomainEvents({ before, after }: AuthenticationEventsParams): AuthenticationAuditEventParams[] {
    const added = after.allowedAuthDomains.filter((domain) => !before.allowedAuthDomains.includes(domain))
    const removed = before.allowedAuthDomains.filter((domain) => !after.allowedAuthDomains.includes(domain))
    return [
        ...added.map((domain): AuthenticationAuditEventParams => ({ action: ApplicationEventName.ALLOWED_DOMAIN_ADDED, data: { domain } })),
        ...removed.map((domain): AuthenticationAuditEventParams => ({ action: ApplicationEventName.ALLOWED_DOMAIN_REMOVED, data: { domain } })),
    ]
}

function ssoDomainEvents({ before, after }: AuthenticationEventsParams): AuthenticationAuditEventParams[] {
    const previousDomain = before.ssoDomain ?? null
    const nextDomain = after.ssoDomain ?? null
    const wasVerified = before.ssoDomainVerification?.status === SsoDomainVerificationStatus.VERIFIED
    const isVerified = after.ssoDomainVerification?.status === SsoDomainVerificationStatus.VERIFIED
    if (previousDomain === nextDomain) {
        const justVerified = !isNil(nextDomain) && !wasVerified && isVerified
        return justVerified ? [{ action: ApplicationEventName.SSO_DOMAIN_VERIFIED, data: { domain: nextDomain } }] : []
    }
    const removed: AuthenticationAuditEventParams[] = isNil(previousDomain)
        ? []
        : [{ action: wasVerified ? ApplicationEventName.SSO_DOMAIN_REMOVED : ApplicationEventName.SSO_DOMAIN_VERIFICATION_CANCELLED, data: { domain: previousDomain } }]
    const added: AuthenticationAuditEventParams[] = isNil(nextDomain)
        ? []
        : [{ action: ApplicationEventName.SSO_DOMAIN_ADDED, data: { domain: nextDomain } }]
    return [...removed, ...added]
}

function samlEvents({ before, after }: AuthenticationEventsParams): AuthenticationAuditEventParams[] {
    const previous = readSaml(before)
    const next = readSaml(after)
    if (previous === undefined || next === undefined || deepEqual(previous, next)) {
        return []
    }
    if (isNil(previous)) {
        return [{ action: ApplicationEventName.SAML_CONNECTED, data: {} }]
    }
    if (isNil(next)) {
        return [{ action: ApplicationEventName.SSO_DISABLED, data: {} }]
    }
    return [{ action: ApplicationEventName.SAML_CONNECTION_REPLACED, data: {} }]
}

function readSaml(platform: AuthenticationEventsPlatform): SAMLAuthnProviderConfig | null | undefined {
    return 'federatedAuthProviders' in platform ? platform.federatedAuthProviders?.saml ?? null : undefined
}

export const authenticationAuditEvents = {
    build: buildAuthenticationEvents,
}

type AuthenticationEventsPlatform = Platform | PlatformWithoutFederatedAuth

type AuthenticationEventsParams = {
    before: AuthenticationEventsPlatform
    after: AuthenticationEventsPlatform
}

type ToggleEventsParams = {
    previous: boolean
    next: boolean
    enabledAction: AuthenticationSettingEvent['action']
    disabledAction: AuthenticationSettingEvent['action']
}

export type AuthenticationAuditEventParams = Pick<AuthenticationSettingEvent, 'action' | 'data'> | Pick<AuthenticationDomainEvent, 'action' | 'data'>
