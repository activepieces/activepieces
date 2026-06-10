import { ActivepiecesError, apId, EmbedSubdomain, EmbedSubdomainStatus, ErrorCode, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { cloudflareService } from './cloudflare.service'
import { EmbedSubdomainEntity } from './embed-subdomain.entity'

const repo = repoFactory<EmbedSubdomain>(EmbedSubdomainEntity)

export const embedSubdomainService = (log: FastifyBaseLogger) => ({
    async upsert({ platformId, hostname }: { platformId: string, hostname: string }): Promise<EmbedSubdomain> {
        const existing = await repo().findOneBy({ platformId })
        if (!isNil(existing) && existing.hostname === hostname) {
            return existing
        }

        const collidingDb = await repo().findOneBy({ hostname })
        if (!isNil(collidingDb) && collidingDb.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'This hostname is already in use',
                },
            })
        }

        const existsInCloudflare = await cloudflareService(log).hostnameExists({ hostname })
        if (existsInCloudflare) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'This hostname is already registered with Cloudflare',
                },
            })
        }

        const newCloudflare = await cloudflareService(log).createCustomHostname({ hostname })

        if (isNil(existing)) {
            const subdomain: Omit<EmbedSubdomain, 'created' | 'updated'> = {
                id: apId(),
                platformId,
                hostname,
                status: mapCloudflareStatus({ status: newCloudflare.status, sslStatus: newCloudflare.sslStatus }),
                cloudflareId: newCloudflare.cloudflareId,
                verificationRecords: newCloudflare.verificationRecords,
            }
            return repo().save(subdomain)
        }

        const oldCloudflareId = existing.cloudflareId
        const updated = await repo().save({
            ...existing,
            hostname,
            cloudflareId: newCloudflare.cloudflareId,
            verificationRecords: newCloudflare.verificationRecords,
            status: mapCloudflareStatus({ status: newCloudflare.status, sslStatus: newCloudflare.sslStatus }),
        })

        const deleteResult = await tryCatch(() => cloudflareService(log).deleteCustomHostname({ cloudflareId: oldCloudflareId }))
        if (deleteResult.error) {
            log.warn({ platformId, oldCloudflareId, error: deleteResult.error }, 'Failed to delete previous Cloudflare custom hostname; manual cleanup may be required')
        }

        return updated
    },

    async getByPlatformId({ platformId }: { platformId: string }): Promise<EmbedSubdomain | null> {
        return repo().findOneBy({ platformId })
    },

    async checkAndUpdateStatus({ platformId }: { platformId: string }): Promise<EmbedSubdomain | null> {
        const record = await repo().findOneBy({ platformId })
        if (isNil(record) || record.status === EmbedSubdomainStatus.ACTIVE) {
            return record
        }

        const statusResult = await tryCatch(() => cloudflareService(log).getCustomHostname({ cloudflareId: record.cloudflareId }))
        if (statusResult.error) {
            log.warn({ platformId, cloudflareId: record.cloudflareId, error: statusResult.error }, 'Failed to refresh hostname status from Cloudflare; returning cached record')
            return record
        }
        const cloudflareStatus = statusResult.data
        const newStatus = mapCloudflareStatus({ status: cloudflareStatus.status, sslStatus: cloudflareStatus.sslStatus })

        const recordsChanged = JSON.stringify(record.verificationRecords) !== JSON.stringify(cloudflareStatus.verificationRecords)
        if (newStatus !== record.status || recordsChanged) {
            log.info({ platformId, oldStatus: record.status, newStatus, cloudflareStatus: cloudflareStatus.status, sslStatus: cloudflareStatus.sslStatus }, 'Embed hostname status refreshed')
            return repo().save({
                ...record,
                status: newStatus,
                verificationRecords: cloudflareStatus.verificationRecords,
            })
        }

        return record
    },

    async getActiveSubdomainUrl({ platformId }: { platformId: string }): Promise<string | null> {
        const record = await repo().findOneBy({ platformId })
        if (isNil(record) || record.status !== EmbedSubdomainStatus.ACTIVE) {
            return null
        }
        return `https://${record.hostname}`
    },

    async getByHostname({ hostname }: { hostname: string }): Promise<EmbedSubdomain | null> {
        return repo().findOneBy({ hostname })
    },
})

function mapCloudflareStatus({ status, sslStatus }: { status: string | undefined, sslStatus: string | undefined }): EmbedSubdomainStatus {
    if (status === 'active' && sslStatus === 'active') {
        return EmbedSubdomainStatus.ACTIVE
    }
    if (!isNil(status) && FAILED_STATUSES.has(status)) {
        return EmbedSubdomainStatus.FAILED
    }
    return EmbedSubdomainStatus.PENDING_VERIFICATION
}

const FAILED_STATUSES = new Set([
    'blocked',
    'pending_blocked',
    'test_blocked',
    'test_failed',
    'pending_deletion',
])
