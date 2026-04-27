import * as crypto from 'crypto'
import { ApEdition, apId, isNil, PlatformCopilotRegisterRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../core/db/repo-factory'
import { CopilotPlatformRegistryEntity, CopilotPlatformRegistrySchema } from './copilot-platform-registry.entity'

const copilotRegistryRepo = repoFactory<CopilotPlatformRegistrySchema>(CopilotPlatformRegistryEntity)

const hashKey = (key: string): string => {
    return crypto.createHash('sha256').update(key).digest('hex')
}

const constantTimeEqual = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a, 'hex')
    const bufferB = Buffer.from(b, 'hex')
    if (bufferA.length !== bufferB.length) return false
    return crypto.timingSafeEqual(bufferA, bufferB)
}

export const copilotPlatformRegistryService = {
    async register({ platformId, edition, version }: PlatformCopilotRegisterRequest): Promise<{ copilotApiKey: string }> {
        const copilotApiKey = `apc_${crypto.randomBytes(32).toString('hex')}`
        const copilotApiKeyHash = hashKey(copilotApiKey)

        const existing = await copilotRegistryRepo().findOneBy({ platformId })
        const now = dayjs().toISOString()

        if (isNil(existing)) {
            await copilotRegistryRepo().insert({
                id: apId(),
                platformId,
                copilotApiKeyHash,
                edition,
                version,
                blockedAt: null,
                lastSeenAt: now,
            })
        }
        else {
            await copilotRegistryRepo().update({ platformId }, {
                copilotApiKeyHash,
                edition,
                version,
                lastSeenAt: now,
            })
        }

        return { copilotApiKey }
    },

    async validateAndTouch({ copilotApiKey, platformId }: { copilotApiKey: string, platformId: string }): Promise<{ status: 'ok' } | { status: 'unknown' } | { status: 'blocked' }> {
        const row = await copilotRegistryRepo().findOneBy({ platformId })
        if (isNil(row)) {
            return { status: 'unknown' }
        }
        if (!constantTimeEqual(hashKey(copilotApiKey), row.copilotApiKeyHash)) {
            return { status: 'unknown' }
        }
        if (!isNil(row.blockedAt)) {
            return { status: 'blocked' }
        }
        await copilotRegistryRepo().update({ platformId }, { lastSeenAt: dayjs().toISOString() })
        return { status: 'ok' }
    },

    async markBlocked(platformId: string): Promise<void> {
        await copilotRegistryRepo().update({ platformId }, { blockedAt: dayjs().toISOString() })
    },
}

export type CopilotPlatformRegistryEdition = ApEdition
