import { resolveTxt } from 'dns/promises'
import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, isNil, PlatformId, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { ApEdition, AuthenticationResponse, SAMLAuthnProviderConfig, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { authenticationService } from '../../../authentication/authentication.service'
import { distributedStore } from '../../../database/redis-connections'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { platformRepo, platformService } from '../../../platform/platform.service'
import { platformUtils } from '../../../platform/platform.utils'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async getAcsUrl(platformId: string): Promise<string> {
            const baseUrl = await domainHelper.getPublicApiUrl({ path: '/v1/authn/saml/acs' })
            if (system.getEdition() === ApEdition.CLOUD) {
                // we still want to support entreprise customers who are still using custom domains . without forcing them to change their saml redirect url
                const legacyHost = await platformUtils.getLegacyHostByPlatformId(platformId)
                if (legacyHost) {
                    return `https://${legacyHost}/api/v1/authn/saml/acs`
                }
                return `${baseUrl}?platformId=${encodeURIComponent(platformId)}`
            }
            return baseUrl
        },
        async getSamlConfigOrThrow(platformId: string | null): Promise<SamlConfigResult> {
            assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
            const platform = await platformService(log).getOneWithFederatedAuthOrThrow(platformId)
            const saml = platform.federatedAuthProviders.saml
            assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
            return { saml, platformId }
        },
        async login({ platformId, samlProvider, from, originBaseUrl }: LoginParams): Promise<LoginResponse> {
            const acsUrl = await this.getAcsUrl(platformId)

            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const safeFrom = !isNil(from) && isSafeRelativePath(from) ? from : null
            const relayState = await storeRelayState({ from: safeFrom, originBaseUrl })
            const redirectUrl = client.getLoginUrl(relayState)
            return {
                redirectUrl,
            }
        },
        async acs({ platformId, samlProvider, idpLoginResponse, relayState }: AcsParams): Promise<AcsResponse> {
            const acsUrl = await this.getAcsUrl(platformId)
            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
            const authenticationResponse = await authenticationService(log).federatedAuthn({
                email: attributes.email,
                firstName: attributes.firstName,
                lastName: attributes.lastName,
                newsLetter: false,
                trackEvents: true,
                provider: UserIdentityProvider.SAML,
                predefinedPlatformId: platformId,
            })
            const resolved = await resolveRelayState(relayState)
            return {
                authenticationResponse,
                from: resolved?.from ?? null,
                originBaseUrl: resolved?.originBaseUrl ?? null,
            }
        },
        async discoverByDomain(domain: string): Promise<DiscoverResult> {
            const ssoDomain = domain.trim().toLowerCase()
            if (ssoDomain.length === 0) {
                return { platformId: null }
            }
            const platform = await platformRepo().findOneBy({ ssoDomain })
            if (isNil(platform)) {
                return { platformId: null }
            }
            if (platform.ssoDomainVerification?.status !== SsoDomainVerificationStatus.VERIFIED) {
                return { platformId: null }
            }
            const plan = await platformPlanService(log).getOrCreateForPlatform(platform.id)
            if (!plan.ssoEnabled) {
                return { platformId: null }
            }
            const samlConfigured = await platformService(log).hasSamlConfigured(platform.id)
            if (!samlConfigured) {
                return { platformId: null }
            }
            return { platformId: platform.id }
        },
        async updateSsoDomain({ platformId, ssoDomain }: UpdateSsoDomainParams): Promise<SsoDomainState> {
            const normalized = ssoDomain?.trim().toLowerCase() ?? null
            const value = normalized && normalized.length > 0 ? normalized : null
            if (!isNil(value)) {
                if (!z.hostname().safeParse(value).success || !value.includes('.')) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'SSO domain must be a valid lowercase domain (e.g. acme.com)',
                        },
                    })
                }
                const existing = await platformRepo().findOneBy({ ssoDomain: value })
                if (!isNil(existing) && existing.id !== platformId) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'This SSO domain is already in use',
                        },
                    })
                }
            }

            const current = await platformService(log).getOneOrThrow(platformId)
            const verification = computeNextVerification({ nextDomain: value, currentDomain: current.ssoDomain ?? null, currentVerification: current.ssoDomainVerification ?? null })

            await platformService(log).update({ id: platformId, ssoDomain: value, ssoDomainVerification: verification })
            return { ssoDomain: value, ssoDomainVerification: verification }
        },
        async verifySsoDomain({ platformId }: VerifySsoDomainParams): Promise<SsoDomainState> {
            const platform = await platformService(log).getOneOrThrow(platformId)
            if (isNil(platform.ssoDomain) || isNil(platform.ssoDomainVerification)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'No SSO domain configured for this platform',
                    },
                })
            }
            if (platform.ssoDomainVerification.status === SsoDomainVerificationStatus.VERIFIED) {
                return { ssoDomain: platform.ssoDomain, ssoDomainVerification: platform.ssoDomainVerification }
            }

            const matched = await txtRecordMatches({ name: platform.ssoDomainVerification.record.name, expected: platform.ssoDomainVerification.record.value, log })
            if (!matched) {
                return { ssoDomain: platform.ssoDomain, ssoDomainVerification: platform.ssoDomainVerification }
            }

            const verified: SsoDomainVerification = {
                ...platform.ssoDomainVerification,
                status: SsoDomainVerificationStatus.VERIFIED,
            }
            const updated = await platformService(log).update({ id: platformId, ssoDomainVerification: verified })
            return { ssoDomain: updated.ssoDomain ?? null, ssoDomainVerification: updated.ssoDomainVerification ?? null }
        },
        async expirePendingSsoDomains(): Promise<void> {
            const result = await platformRepo()
                .createQueryBuilder()
                .update()
                .set({ ssoDomain: null, ssoDomainVerification: null })
                .where('"ssoDomain" IS NOT NULL')
                .andWhere('"ssoDomainVerification"->>\'status\' = :status', { status: SsoDomainVerificationStatus.PENDING_VERIFICATION })
                .andWhere(`("ssoDomainVerification"->>'createdAt')::timestamptz < NOW() - INTERVAL '${PENDING_DOMAIN_TTL_HOURS} hour'`)
                .execute()
            const affected = result.affected ?? 0
            if (affected > 0) {
                log.info({ affected }, 'Expired pending SSO domain verifications')
            }
        },
    }
}

const RELAY_STATE_KEY_PREFIX = 'saml-relay-state:'
const RELAY_STATE_TTL_SECONDS = 5 * 60

function relayStateKey(token: string): string {
    return `${RELAY_STATE_KEY_PREFIX}${token}`
}

// `from` can be any relative path the login was initiated from (e.g. `/mcp-authorize?...`), so a
// naive `startsWith('/')` check isn't enough to rule out an open redirect: strings like `//evil.com`
// (protocol-relative) or `/\evil.com` (backslash normalizes to `/` for special schemes under WHATWG
// URL parsing) still look like they start with a single slash but resolve off-origin in a browser.
// Resolving against a fixed, unguessable dummy origin and checking that the parsed origin didn't
// change catches both cases without needing to enumerate every escaping trick by hand.
function isSafeRelativePath(path: string): boolean {
    const dummyBaseUrl = 'https://saml-relay-state.invalid'
    const parsed = tryCatchSync(() => new URL(path, dummyBaseUrl))
    return isNil(parsed.error) && parsed.data.origin === dummyBaseUrl
}

// The SAML ACS URL is statically IdP-registered (built from config, never from the live /acs
// request — see getAcsUrl), so /acs can never observe which host a login actually started from.
// /login's own request host is reliable, so we capture it there and round-trip it through RelayState
// alongside `from`, and use it directly as the redirect's base URL in acs(). This generalizes to any
// host that can reach /login without route- or env-var-based coupling.
// SAML's RelayState is also capped at ~80 bytes by spec and is threaded verbatim through the IdP, so it
// can't safely carry `from` directly — the MCP case embeds a signed JWT there and can run to a few KB.
// Store the value server-side under a short opaque token instead, and pass only the token as RelayState.
// Uses `distributedStore` (Redis) rather than an in-memory map because `/login` and `/acs` can land on
// different app replicas.
async function storeRelayState({ from, originBaseUrl }: RelayStateValue): Promise<string> {
    const token = apId()
    await distributedStore.put(relayStateKey(token), { from, originBaseUrl }, RELAY_STATE_TTL_SECONDS)
    return token
}

// Single-use by construction: the token is deleted as soon as it's read, so a replayed RelayState
// (e.g. a retried/duplicated IdP POST) can't resolve a value a second time. Re-validates `from` as a
// safe relative path in case the stored value was ever corrupted or tampered with (defense in depth
// alongside the check already done when it was first stored in `login()`).
async function resolveRelayState(token: string | undefined): Promise<RelayStateValue | null> {
    if (isNil(token)) {
        return null
    }
    const stored = await distributedStore.get<RelayStateValue>(relayStateKey(token))
    await distributedStore.delete(relayStateKey(token))
    if (isNil(stored) || (!isNil(stored.from) && !isSafeRelativePath(stored.from))) {
        return null
    }
    return stored
}

const PENDING_DOMAIN_TTL_HOURS = 3 // if sso domain was not verified in this number of hours it will be set to null

function computeNextVerification({ nextDomain, currentDomain, currentVerification }: { nextDomain: string | null, currentDomain: string | null, currentVerification: SsoDomainVerification | null }): SsoDomainVerification | null {
    if (isNil(nextDomain)) {
        return null
    }
    if (nextDomain === currentDomain && !isNil(currentVerification)) {
        return currentVerification
    }
    return {
        status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
        record: {
            type: SsoDomainVerificationRecordType.TXT,
            name: `${VERIFICATION_NAME_PREFIX}.${nextDomain}`,
            value: `${VERIFICATION_VALUE_PREFIX}=${apId()}`,
        },
        createdAt: new Date().toISOString(),
    }
}

async function txtRecordMatches({ name, expected, log }: { name: string, expected: string, log: FastifyBaseLogger }): Promise<boolean> {
    const lookup = await tryCatch(() => resolveTxt(name))
    if (lookup.error) {
        log.warn({ name, error: lookup.error }, 'TXT record lookup failed for SSO domain verification')
        return false
    }
    return lookup.data.some((chunks) => chunks.join('').trim() === expected)
}

const VERIFICATION_NAME_PREFIX = '_activepieces-verify'
const VERIFICATION_VALUE_PREFIX = 'activepieces-verify'

type LoginParams = {
    platformId: string
    samlProvider: SAMLAuthnProviderConfig
    from?: string
    originBaseUrl: string
}

type LoginResponse = {
    redirectUrl: string
}

type AcsParams = {
    platformId: string
    samlProvider: SAMLAuthnProviderConfig
    idpLoginResponse: IdpLoginResponse
    relayState?: string
}

type AcsResponse = {
    authenticationResponse: AuthenticationResponse
    from: string | null
    originBaseUrl: string | null
}

type RelayStateValue = {
    from: string | null
    originBaseUrl: string
}

type SamlConfigResult = {
    saml: SAMLAuthnProviderConfig
    platformId: string
}

type DiscoverResult = {
    platformId: string | null
}

type UpdateSsoDomainParams = {
    platformId: PlatformId
    ssoDomain: string | null
}

type VerifySsoDomainParams = {
    platformId: PlatformId
}

type SsoDomainState = {
    ssoDomain: string | null
    ssoDomainVerification: SsoDomainVerification | null
}
