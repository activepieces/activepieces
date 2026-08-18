import { AiProviderKeyStatus, classifyProviderOutcome, isNil, PlatformId, ProviderOutcomeSignal } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const MAX_REASON_LENGTH = 300

// A healthy key under load would otherwise write on every model call, including the AI SDK's own
// retries. A status *change* always lands; an unchanged one refreshes at most this often, which is
// all "last checked" needs. One statement, so there is no read-then-write race between processes.
const REFRESH_UNCHANGED_AFTER_MINUTES = 15

export const aiProviderHealth = (log: FastifyBaseLogger) => ({
    async record({ platformId, providerId, signal }: RecordParams): Promise<AiProviderKeyStatus | null> {
        const status = classifyProviderOutcome(signal)
        if (status === 'no_change') {
            return null
        }
        const reason = status === 'active' ? null : buildReason(signal)
        await aiProviderRepo().createQueryBuilder()
            .update()
            .set({ status, statusReason: reason, statusUpdated: () => 'NOW()' })
            .where('id = :providerId AND "platformId" = :platformId', { providerId, platformId })
            .andWhere('(status <> :status OR "statusUpdated" IS NULL OR "statusUpdated" < NOW() - make_interval(mins => :refreshAfterMinutes))', {
                status,
                refreshAfterMinutes: REFRESH_UNCHANGED_AFTER_MINUTES,
            })
            .execute()
        log.debug({ platform: { id: platformId }, aiProvider: { id: providerId, status } }, '[aiProviderHealth#record] Key status observed')
        return status
    },
})

function buildReason({ statusCode, body, message }: ProviderOutcomeSignal): string | null {
    const detail = message ?? body
    if (isNil(detail) || detail.trim().length === 0) {
        return isNil(statusCode) ? null : `HTTP ${statusCode}`
    }
    const prefix = isNil(statusCode) ? '' : `HTTP ${statusCode}: `
    return `${prefix}${detail.trim()}`.slice(0, MAX_REASON_LENGTH)
}

type RecordParams = {
    platformId: PlatformId
    providerId: string
    signal: ProviderOutcomeSignal
}
