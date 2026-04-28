import * as crypto from 'crypto'
import { apId, isNil, PlatformCopilotRegisterRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../core/db/repo-factory'
import { PlatformCopilotRegistryEntity, PlatformCopilotRegistrySchema } from './platform-copilot-registry.entity'

const registryRepo = repoFactory<PlatformCopilotRegistrySchema>(PlatformCopilotRegistryEntity)

const hashKey = (key: string): string => {
    return crypto.createHash('sha256').update(key).digest('hex')
}

const constantTimeEqual = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a, 'hex')
    const bufferB = Buffer.from(b, 'hex')
    if (bufferA.length !== bufferB.length) return false
    return crypto.timingSafeEqual(bufferA, bufferB)
}

export const platformCopilotRegistryService = {
    async register({ platformId, edition, version }: PlatformCopilotRegisterRequest): Promise<{ copilotApiKey: string }> {
        const copilotApiKey = `apc_${crypto.randomBytes(32).toString('hex')}`
        const copilotApiKeyHash = hashKey(copilotApiKey)
        const now = dayjs().toISOString()

        await registryRepo().upsert(
            {
                id: apId(),
                platformId,
                copilotApiKeyHash,
                edition,
                version,
                blockedAt: null,
                lastSeenAt: now,
            },
            { conflictPaths: ['platformId'], skipUpdateIfNoValuesChanged: false },
        )

        return { copilotApiKey }
    },

    async validateAndTouch({ copilotApiKey, platformId }: { copilotApiKey: string, platformId: string }): Promise<{ status: 'ok' } | { status: 'unknown' } | { status: 'blocked' }> {
        const row = await registryRepo().findOneBy({ platformId })
        if (isNil(row)) {
            return { status: 'unknown' }
        }
        if (!constantTimeEqual(hashKey(copilotApiKey), row.copilotApiKeyHash)) {
            return { status: 'unknown' }
        }
        if (!isNil(row.blockedAt)) {
            return { status: 'blocked' }
        }
        await registryRepo().update({ platformId }, { lastSeenAt: dayjs().toISOString() })
        return { status: 'ok' }
    },

    async markBlocked(platformId: string): Promise<void> {
        await registryRepo().update({ platformId }, { blockedAt: dayjs().toISOString() })
    },
}
