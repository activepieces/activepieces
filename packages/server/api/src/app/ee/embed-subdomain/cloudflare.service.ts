import { ActivepiecesError, EmbedVerificationRecord, EmbedVerificationRecordPurpose, EmbedVerificationRecordType, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import Cloudflare from 'cloudflare'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

let client: Cloudflare | null = null

export const cloudflareService = (log: FastifyBaseLogger) => ({
    async createCustomHostname({ hostname }: { hostname: string }): Promise<CloudflareHostnameResult> {
        const { zoneId, fallbackOrigin } = getConfig()

        const created = await tryCatch(() => getClient().customHostnames.create({
            zone_id: zoneId,
            hostname,
            ssl: {
                method: 'txt',
                type: 'dv',
                bundle_method: 'ubiquitous',
            },
        }))
        if (created.error) {
            log.warn({ hostname, error: created.error }, 'Cloudflare createCustomHostname failed')
            throw toActivepiecesError(created.error, 'register hostname with Cloudflare')
        }
        const result = created.data

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

        const fetched = await tryCatch(() => getClient().customHostnames.get(cloudflareId, { zone_id: zoneId }))
        if (fetched.error) {
            log.warn({ cloudflareId, error: fetched.error }, 'Cloudflare getCustomHostname failed')
            throw toActivepiecesError(fetched.error, 'fetch hostname status from Cloudflare')
        }
        const result = fetched.data

        return {
            status: result.status,
            sslStatus: result.ssl?.status,
            hostname: result.hostname,
            verificationRecords: extractVerificationRecords({ result, hostname: result.hostname, fallbackOrigin }),
        }
    },

    async hostnameExists({ hostname }: { hostname: string }): Promise<boolean> {
        const { zoneId } = getConfig()

        const result = await tryCatch(() => getClient().customHostnames.list({ zone_id: zoneId, hostname }))
        if (result.error) {
            log.warn({ hostname, error: result.error }, 'Failed to check hostname existence in Cloudflare')
            return false
        }
        return result.data.result.length > 0
    },

    async deleteCustomHostname({ cloudflareId }: { cloudflareId: string }): Promise<void> {
        const { zoneId } = getConfig()
        const deleted = await tryCatch(() => getClient().customHostnames.delete(cloudflareId, { zone_id: zoneId }))
        if (deleted.error) {
            log.warn({ cloudflareId, error: deleted.error }, 'Cloudflare deleteCustomHostname failed')
            throw toActivepiecesError(deleted.error, 'delete hostname from Cloudflare')
        }
        log.info({ cloudflareId }, 'Cloudflare custom hostname deleted')
    },
})

function toActivepiecesError(error: unknown, op: string): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: extractCloudflareMessage(error, op),
        },
    })
}

function extractCloudflareMessage(error: unknown, op: string): string {
    const fallback = `Couldn't ${op}. Please try again or contact support if the issue persists.`
    if (!(error instanceof Error)) {
        return fallback
    }
    const apiErrors = (error as { errors?: Array<{ message?: string }> }).errors
    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const first = apiErrors[0]?.message
        if (typeof first === 'string' && first.length > 0) {
            return `Cloudflare: ${first}`
        }
    }
    if (typeof error.message === 'string' && error.message.length > 0) {
        return `Cloudflare: ${error.message}`
    }
    return fallback
}

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
