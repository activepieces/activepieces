import { resolveTxt } from 'dns/promises'
import { ActivepiecesError, apId, AuthenticationResponse, ErrorCode, isNil, PlatformId, SAMLAuthnProviderConfig, SsoDomainVerification, SsoDomainVerificationRecordType, SsoDomainVerificationStatus, tryCatch, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { authenticationService } from '../../../authentication/authentication.service'
import { platformRepo, platformService } from '../../../platform/platform.service'
import { createSamlClient, IdpLoginResponse } from './saml-client'

export const authnSsoSamlService = (log: FastifyBaseLogger) => {
    return {
        async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
            const client = await createSamlClient(platformId, samlProvider)
            const redirectUrl = client.getLoginUrl()
            return {
                redirectUrl,
            }
        },
        async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<AuthenticationResponse> {
            const client = await createSamlClient(platformId, samlProvider)
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
            return { ssoDomain, ssoDomainVerification: verification }
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
    }
}

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
