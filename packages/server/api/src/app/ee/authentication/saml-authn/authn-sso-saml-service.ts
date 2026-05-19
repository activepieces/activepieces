import { resolveTxt } from 'dns/promises'
import { ActivepiecesError, ApEdition, apId, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, isNil, PlatformId, SAMLAuthnProviderConfig, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus, tryCatch, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { authenticationService } from '../../../authentication/authentication.service'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { platformRepo, platformService } from '../../../platform/platform.service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async getAcsUrl(platformId: string): Promise<string> {
            const baseUrl = await domainHelper.getPublicApiUrl({ path: '/v1/authn/saml/acs' })
            return system.getEdition() === ApEdition.CLOUD
                ? `${baseUrl}?platformId=${encodeURIComponent(platformId)}`
                : baseUrl
        },
        async getSamlConfigOrThrow(platformId: string | null): Promise<SamlConfigResult> {
            assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
            const platform = await platformService(log).getOneWithFederatedAuthOrThrow(platformId)
            const saml = platform.federatedAuthProviders.saml
            assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
            return { saml, platformId }
        },
        async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
            const acsUrl = await this.getAcsUrl(platformId)
            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const redirectUrl = client.getLoginUrl()
            return {
                redirectUrl,
            }
        },
        async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<AuthenticationResponse> {
            const acsUrl = await this.getAcsUrl(platformId)
            const client = await createSamlClient({ platformId, samlProvider, acsUrl })
            const attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
            return authenticationService(log).federatedAuthn({
                email: attributes.email,
                firstName: attributes.firstName,
                lastName: attributes.lastName,
                newsLetter: false,
                trackEvents: true,
                provider: UserIdentityProvider.SAML,
                predefinedPlatformId: platformId,
            })
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

type LoginResponse = {
    redirectUrl: string
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
