import { AiProviderKeyStatus, classifyProviderOutcome, isNil, PlatformId, ProviderOutcomeSignal } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const MAX_REASON_LENGTH = 300

const REFRESH_UNCHANGED_AFTER_MINUTES = 15

export const aiProviderHealth = (log: FastifyBaseLogger) => ({
    async record({ platformId, providerId, signal, throttled = true }: RecordParams): Promise<AiProviderKeyStatus | null> {
        const status = classifyProviderOutcome(signal)
        if (status === 'no_change') {
            return null
        }
        const reason = status === 'active' ? null : buildReason(signal)
        const observedAtMs = signal.observedAt ?? Date.now()
        const observedAt = new Date(observedAtMs).toISOString()
        const refreshBefore = throttled ? new Date(observedAtMs - REFRESH_UNCHANGED_AFTER_MINUTES * 60_000).toISOString() : observedAt
        const updateResult = await aiProviderRepo().createQueryBuilder()
            .update()
            .set({ status, statusReason: reason, statusUpdated: observedAt })
            .where('id = :providerId AND "platformId" = :platformId', { providerId, platformId })
            .andWhere('("statusUpdated" IS NULL OR "statusUpdated" <= :observedAt)', { observedAt })
            .andWhere('(status <> :status OR "statusUpdated" IS NULL OR "statusUpdated" < :refreshBefore)', { status, refreshBefore })
            .returning(['status'])
            .execute()

        const applied = Array.isArray(updateResult.raw) && updateResult.raw.length > 0
        log.debug({ platform: { id: platformId }, aiProvider: { id: providerId, status }, applied }, '[aiProviderHealth#record] Key status observed')
        return applied ? status : null
    },
})

function printable(text: string | undefined): string | undefined {
    return isNil(text) ? undefined : text.replace(/[\u0000-\u001f\u007f]/g, ' ')
}

function buildReason({ statusCode, body, message }: ProviderOutcomeSignal): string | null {
    const detail = printable(message ?? body)
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
    throttled?: boolean
}
