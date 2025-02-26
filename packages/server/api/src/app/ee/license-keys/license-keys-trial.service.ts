import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, Platform } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { customDomainService } from '../custom-domains/custom-domain.service'
import { licenseKeysService } from './license-keys-service'

export const licenseKeysTrialService = (log: FastifyBaseLogger): {
    requestTrial: (params: RequestTrialParams) => Promise<{ message: string }>
    extendTrial: (params: ExtendTrialParams) => Promise<void>
} => ({
    async requestTrial({
        email,
        companyName,
        selfHosting,
        ultimatePlan,
        productionKey,
    }: RequestTrialParams): Promise<{ message: string }> {
        try {
            const disabledFeatures = getDisabledFeatures(ultimatePlan)
            const isEmbeddingsEnabled = !ultimatePlan
            const activationMessage = 'Activation Path: Platform Admin -> Setup -> License Keys'
            let message = ''

            if (selfHosting) {
                const { trialLicenseKey } = await generateSelfHostingTrialLicense(email, companyName, disabledFeatures, isEmbeddingsEnabled, productionKey, log)
                message = `Your license ${productionKey ? 'production' : 'development'} key is: ${trialLicenseKey}. <br><br> ${activationMessage}`
            }
            else {
                const platform = await fetchPlatform(email, log)
                const { developmentTrialLicenseKey, productionTrialLicenseKey, subdomain } = await generateCloudTrialLicense(email, platform.id, companyName, disabledFeatures, isEmbeddingsEnabled, log)
                message = `Your development license key is: ${developmentTrialLicenseKey}. <br><br> Your production license key is: ${productionTrialLicenseKey}. <br><br> Your domain is: ${subdomain}. <br><br> ${activationMessage}`
            }
            return { message }
        }
        catch (e) {
            log.error(e, '[LicenseKeysTrialService#requestTrial] Failed to request trial')
            return { message: `Failed to request trial. Please try again later or contact support. (${e instanceof Error ? e.message : 'Unknown error'})` }
        }
    },

    async extendTrial({
        email,
        days,
    }: ExtendTrialParams): Promise<void> {
        await licenseKeysService(log).extendTrial({
            email,
            days,
        })
    },
})
async function fetchPlatform(email: string, log: FastifyBaseLogger): Promise<Platform> {
    const userIdentity = await userIdentityService(log).getIdentityByEmail(email)
    const userNotFoundError = new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
            message: 'User identity or platform not found',
        },
    })

    if (isNil(userIdentity)) {
        throw userNotFoundError
    }

    const user = await userService.getOneByIdentityIdOnly({
        identityId: userIdentity.id,
    })

    const platformId = user?.platformId
    if (!platformId) {
        throw userNotFoundError
    }

    const platform = await platformService.getOneOrThrow(platformId)
    return platform
}

async function generateSelfHostingTrialLicense(email: string, companyName: string, disabledFeatures: string[], isEmbeddingsEnabled: boolean, productionKey: boolean, log: FastifyBaseLogger): Promise<{ trialLicenseKey: string }> {
    const trialLicenseKey = await generateLicenseKey(email, companyName, disabledFeatures, isEmbeddingsEnabled, productionKey ? 'production' : 'development', log)
    return { trialLicenseKey }
}

async function generateCloudTrialLicense(workEmail: string, platformId: string, companyName: string, disabledFeatures: string[], isEmbeddingsEnabled: boolean, log: FastifyBaseLogger): Promise<{ developmentTrialLicenseKey: string, productionTrialLicenseKey: string, subdomain: string }> {
    const subdomain = workEmail.split('@')[1].split('.')[0]
    const domain = 'activepieces.com'
    const target = 'cloud.activepieces.com'
    await addCNAMERecord(subdomain, target, log)
    await customDomainService.create({
        domain: `${subdomain}.${domain}`,
        platformId,
    })
    const developmentTrialLicenseKey = await generateLicenseKey(workEmail, companyName, disabledFeatures, isEmbeddingsEnabled, 'development', log, platformId)
    const productionTrialLicenseKey = await generateLicenseKey(workEmail, companyName, disabledFeatures, isEmbeddingsEnabled, 'production', log, platformId)
    return {
        developmentTrialLicenseKey,
        productionTrialLicenseKey,
        subdomain: `${subdomain}.${domain}`,
    }
}

async function generateLicenseKey(workEmail: string, companyName: string, disabledFeatures: string[], isEmbeddingsEnabled: boolean, keyType: 'development' | 'production', log: FastifyBaseLogger, platformId?: string): Promise<string> {
    const trialLicenseKey = await licenseKeysService(log).requestTrial({
        email: workEmail,
        companyName,
        goal: 'Manual Trial',
        keyType,
        disabledFeatures,
        isEmbeddingsEnabled,
    })

    await licenseKeysService(log).markAsActiviated({
        key: trialLicenseKey,
        platformId,
    })

    return trialLicenseKey
}

async function addCNAMERecord(
    subdomain: string,
    target: string,
    log: FastifyBaseLogger,
): Promise<boolean> {
    try {
        const CLOUDFLARE_API_BASE = system.getOrThrow(AppSystemProp.CLOUDFLARE_API_BASE)
        const CLOUDFLARE_API_TOKEN = system.getOrThrow(AppSystemProp.CLOUDFLARE_API_TOKEN)
        const CLOUDFLARE_ZONE_ID = system.getOrThrow(AppSystemProp.CLOUDFLARE_ZONE_ID)
        const cnameResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'CNAME',
                name: subdomain,
                content: target,
                ttl: 3600,
                proxied: true,
            }),
        })
        const cnameData = await cnameResponse.json()
        if (cnameData.success) {
            log.info(`CNAME record for "${subdomain}" pointing to "${target}" created successfully.`)
            return true
        }
        else {
            const errorMessage = cnameData.errors?.map((error: { message: string }) => error.message).join(', ') || 'Unknown error'
            throw new Error(`Failed to create CNAME record: ${errorMessage}`)
        }
    }
    catch (error: unknown) {
        log.error({ error }, 'Error creating CNAME record')
        throw new Error(`Failed to create CNAME record: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

function getDisabledFeatures(ultimatePlan: boolean): string[] {
    if (ultimatePlan) {
        return []
    }
    else {
        return [
            'ssoEnabled',
            'showPoweredBy',
            'auditLogEnabled',
            'globalConnectionsEnabled',
            'customRolesEnabled',
            'environmentsEnabled',
        ]
    }
}

type RequestTrialParams = {
    email: string
    companyName: string
    selfHosting: boolean
    ultimatePlan: boolean
    productionKey: boolean
}

type ExtendTrialParams = {
    email: string
    days: number
}
