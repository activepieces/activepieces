import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, Platform } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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
    }: RequestTrialParams): Promise<{ message: string }> {
        const disabledFeatures = getDisabledFeatures(ultimatePlan)
        const activationMessage = 'Activation Path: Platform Admin -> Setup -> License Keys\n\n'
        let message = ''
        
        if (selfHosting) {
            const { trialLicenseKey } = await generateSelfHostingTrialLicense(email, companyName, disabledFeatures, log)
            message = `Your license key is: ${trialLicenseKey}. \n\n ${activationMessage}`
        }
        else {
            const platform = await fetchPlatform(email)
            const { trialLicenseKey1, trialLicenseKey2, subdomain } = await generateCloudTrialLicense(email, platform.id, companyName, disabledFeatures, log)
            message = `Your development key is: ${trialLicenseKey1}. Your production key is: ${trialLicenseKey2}. and your domain is: ${subdomain}. \n\n ${activationMessage}`
        }
        return { message }
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

async function fetchPlatform(email: string): Promise<Platform> {
    const user = await userService.getByEmail(email)
    if (!user?.platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'User or platform not found',
            },
        })
    }
    return platformService.getOneOrThrow(user.platformId)
}

async function generateSelfHostingTrialLicense(email: string, companyName: string, disabledFeatures: string[], log: FastifyBaseLogger): Promise<{ trialLicenseKey: string }> {
    const trialLicenseKey = await generateLicenseKey(email, companyName, disabledFeatures, 'production', log)
    return { trialLicenseKey }
}

async function generateCloudTrialLicense(workEmail: string, platformId: string, companyName: string, disabledFeatures: string[], log: FastifyBaseLogger): Promise<{ trialLicenseKey1: string, trialLicenseKey2: string, subdomain: string }> {
    const trialLicenseKey1 = await generateLicenseKey(workEmail, companyName, disabledFeatures, 'development', log, platformId)
    const trialLicenseKey2 = await generateLicenseKey(workEmail, companyName, disabledFeatures, 'production', log, platformId)
    const subdomain = workEmail.split('@')[1].split('.')[0]
    const domain = 'activepieces.com'
    const target = 'cloud.activepieces.com'
    await addCNAMERecord(domain, subdomain, target, log)
    await customDomainService.create({
        domain: subdomain,
        platformId,
    })
    return {
        trialLicenseKey1,
        trialLicenseKey2,
        subdomain: `${subdomain}.${domain}`,
    }
}

async function generateLicenseKey(workEmail: string, companyName: string, disabledFeatures: string[], keyType: 'development' | 'production', log: FastifyBaseLogger, platformId?: string): Promise<string> {
    const trialLicenseKey = await licenseKeysService(log).requestTrial({
        email: workEmail,
        companyName,
        goal: 'Manual Trial',
        keyType,
        disabledFeatures,
    })

    await licenseKeysService(log).markAsActiviated({
        key: trialLicenseKey,
        platformId,
    })

    return trialLicenseKey
}

async function addCNAMERecord(
    domain: string,
    subdomain: string,
    target: string,
    log: FastifyBaseLogger,
): Promise<boolean> {
    try {
        const CLOUDFLARE_API_BASE = system.getOrThrow(AppSystemProp.CLOUDFLARE_API_BASE)
        const CLOUDFLARE_API_TOKEN = system.getOrThrow(AppSystemProp.CLOUDFLARE_API_TOKEN)
        const zoneResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones?name=${domain}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        })

        const zoneData = await zoneResponse.json()

        if (!zoneData.success || zoneData.result.length === 0) {
            const errorMessage = zoneData.errors?.map((error: { message: string }) => error.message).join(', ') || 'Zone not found'
            throw new Error(`Failed to fetch zone for domain: ${errorMessage}`)
        }

        const zoneId = zoneData.result[0].id

        const cnameResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/dns_records`, {
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
        return ['embeddingEnabled']
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
}

type ExtendTrialParams = {
    email: string
    days: number
}