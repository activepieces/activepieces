import { EmbedVerificationRecord, EmbedVerificationRecordPurpose, EmbedVerificationRecordType, isNil, tryCatch } from '@activepieces/shared'
import Cloudflare from 'cloudflare'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

let client: Cloudflare | null = null

export const cloudflareService = (log: FastifyBaseLogger) => ({
    async createCustomHostname({ hostname }: { hostname: string }): Promise<CloudflareHostnameResult> {
        const { zoneId, fallbackOrigin } = getConfig()

        const result = await getClient().customHostnames.create({
            zone_id: zoneId,
            hostname,
            ssl: {
                method: 'txt',
                type: 'dv',
                bundle_method: 'ubiquitous',
            },
        })

        log.info({ hostname, cloudflareId: result.id }, 'Cloudflare custom hostname created')

        return {
            cloudflareId: result.id,
            hostname,
            verificationRecords: extractVerificationRecords({ result, hostname, fallbackOrigin }),
            status: result.status,
            sslStatus: result.ssl?.status,
        }
    },

    async getCustomHostname({ cloudflareId }: { cloudflareId: string }): Promise<CloudflareHostnameStatus> {
        const { zoneId, fallbackOrigin } = getConfig()

        const result = await getClient().customHostnames.get(cloudflareId, { zone_id: zoneId })

        return {
            status: result.status,
            sslStatus: result.ssl?.status,
            hostname: result.hostname,
            verificationRecords: extractVerificationRecords({ result, hostname: result.hostname, fallbackOrigin }),
        }
    },

    async hostnameExists({ hostname }: { hostname: string }): Promise<boolean> {
        const { zoneId } = getConfig()

        const result = await tryCatch(async () => {
            const list = await getClient().customHostnames.list({ zone_id: zoneId, hostname })
            return list.result
        })
        if (result.error) {
            log.warn({ hostname, error: result.error }, 'Failed to check hostname existence in Cloudflare')
            return false
        }
        return result.data.length > 0
    },

    async deleteCustomHostname({ cloudflareId }: { cloudflareId: string }): Promise<void> {
        const { zoneId } = getConfig()
        await getClient().customHostnames.delete(cloudflareId, { zone_id: zoneId })
        log.info({ cloudflareId }, 'Cloudflare custom hostname deleted')
    },
})

function getClient(): Cloudflare {
    if (!isNil(client)) return client
    const { apiToken, apiBase } = getConfig()
    client = new Cloudflare({ apiToken, baseURL: apiBase })
    return client
}

function getConfig() {
    return {
        zoneId: system.getOrThrow(AppSystemProp.CLOUDFLARE_ZONE_ID),
        apiToken: system.getOrThrow(AppSystemProp.CLOUDFLARE_API_TOKEN),
        apiBase: system.get(AppSystemProp.CLOUDFLARE_API_BASE) ?? 'https://api.cloudflare.com/client/v4',
        fallbackOrigin: system.get(AppSystemProp.CLOUDFLARE_SAAS_FALLBACK_ORIGIN) ?? 'cloud.activepieces.com',
    }
}

function extractVerificationRecords({ result, hostname, fallbackOrigin }: { result: CloudflareCustomHostnameResult, hostname: string, fallbackOrigin: string }): EmbedVerificationRecord[] {
    const records: EmbedVerificationRecord[] = [
        {
            type: EmbedVerificationRecordType.CNAME,
            name: hostname,
            value: fallbackOrigin,
            purpose: EmbedVerificationRecordPurpose.HOSTNAME,
        },
    ]

    const ownership = result.ownership_verification
    if (!isNil(ownership) && ownership.type === 'txt' && !isNil(ownership.name) && !isNil(ownership.value)) {
        records.push({
            type: EmbedVerificationRecordType.TXT,
            name: ownership.name,
            value: ownership.value,
            purpose: EmbedVerificationRecordPurpose.OWNERSHIP,
        })
    }

    const sslValidationRecords = result.ssl?.validation_records ?? []
    for (const validation of sslValidationRecords) {
        if (!isNil(validation.txt_name) && !isNil(validation.txt_value)) {
            records.push({
                type: EmbedVerificationRecordType.TXT,
                name: validation.txt_name,
                value: validation.txt_value,
                purpose: EmbedVerificationRecordPurpose.SSL,
            })
        }
    }

    return records
}

type CloudflareCustomHostnameResult = {
    id: string
    hostname: string
    status?: string
    ownership_verification?: {
        type?: string
        name?: string
        value?: string
    }
    ssl?: {
        status?: string
        validation_records?: Array<{
            txt_name?: string
            txt_value?: string
        }>
    }
}

type CloudflareHostnameResult = {
    cloudflareId: string
    hostname: string
    verificationRecords: EmbedVerificationRecord[]
    status: string | undefined
    sslStatus: string | undefined
}

type CloudflareHostnameStatus = {
    status: string | undefined
    sslStatus: string | undefined
    hostname: string
    verificationRecords: EmbedVerificationRecord[]
}
