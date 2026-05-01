import { ActivepiecesError, ApplicationEventName, assertNotNullOrUndefined, ErrorCode, isNil, PrincipalType, SAMLAuthnProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { networkUtils } from '../../../helper/network-utils'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformRepo, platformService } from '../../../platform/platform.service'
import { platformUtils } from '../../../platform/platform.utils'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req, req.log)
        const loginResponse = await authnSsoSamlService(req.log).login(platformId, saml)
        return res.redirect(loginResponse.redirectUrl)
    })

    app.post('/acs', AcsRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req, req.log)
        const response = await authnSsoSamlService(req.log).acs(platformId, saml, {
            body: req.body,
            query: req.query,
        })
        const url = new URL('/authenticate', `${req.protocol}://${req.hostname}`)
        url.searchParams.append('response', JSON.stringify(response))
        applicationEvents(req.log).sendUserEvent({
            platformId,
            userId: response.id,
            projectId: response.projectId ?? undefined,
            ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })
        return res.redirect(url.toString())
    })

    app.post('/discover', DiscoverRequest, async (req) => {
        const ssoDomain = req.body.domain.trim().toLowerCase()
        if (ssoDomain.length === 0) {
            return { platformId: null }
        }
        const platform = await platformRepo().findOneBy({ ssoDomain })
        if (isNil(platform)) {
            return { platformId: null }
        }
        const plan = await platformPlanService(req.log).getOrCreateForPlatform(platform.id)
        if (!plan.ssoEnabled) {
            return { platformId: null }
        }
        const samlConfigured = await platformService(req.log).hasSamlConfigured(platform.id)
        if (!samlConfigured) {
            return { platformId: null }
        }
        return { platformId: platform.id }
    })

    app.post('/sso-domain', UpdateSsoDomainRequest, async (req) => {
        const platformId = req.principal.platform.id
        const normalized = req.body.ssoDomain?.trim().toLowerCase() ?? null
        const ssoDomain = normalized && normalized.length > 0 ? normalized : null
        if (!isNil(ssoDomain)) {
            if (!z.hostname().safeParse(ssoDomain).success || !ssoDomain.includes('.')) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'SSO domain must be a valid lowercase domain (e.g. acme.com)',
                    },
                })
            }
            const existing = await platformRepo().findOneBy({ ssoDomain })
            if (!isNil(existing) && existing.id !== platformId) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'This SSO domain is already in use',
                    },
                })
            }
        }
        return platformService(req.log).update({ id: platformId, ssoDomain })
    })
}

async function getSamlConfigOrThrow(req: FastifyRequest, log: FastifyBaseLogger): Promise<{ saml: SAMLAuthnProviderConfig, platformId: string }> {
    const query = req.query as Record<string, unknown>
    const platformIdFromQuery = typeof query?.platformId === 'string' ? query.platformId : null
    const platformId = platformIdFromQuery ?? await platformUtils.getPlatformIdForRequest(req)
    assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
    const platform = await platformService(log).getOneWithFederatedAuthOrThrow(platformId)
    const saml = platform.federatedAuthProviders.saml
    assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
    return {
        saml,
        platformId,
    }
}

const AcsRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.record(z.string(), z.unknown()),
        querystring: z.object({
            platformId: z.string().optional(),
        }).catchall(z.unknown()),
    },
}

const LoginRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            platformId: z.string().optional(),
        }),
    },
}

const DiscoverRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({
            domain: z.string().min(1).max(253),
        }),
        response: {
            200: z.object({
                platformId: z.string().nullable(),
            }),
        },
    },
}

const UpdateSsoDomainRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: z.object({
            ssoDomain: z.string().max(253).nullable(),
        }),
    },
}
