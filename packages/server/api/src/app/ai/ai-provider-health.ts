import { AiProviderKeyStatus, classifyProviderOutcome, isNil, nextObservedAt, PlatformId, ProviderOutcomeSignal } from '@activepieces/core-utils'
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
        const observedSecondsAgo = secondsSince(signal.observedAt)
        const refreshSecondsAgo = throttled ? observedSecondsAgo + REFRESH_UNCHANGED_AFTER_MINUTES * 60 : observedSecondsAgo
        const rows = await aiProviderRepo().query(
            `UPDATE "ai_provider"
             SET "status" = $1, "statusReason" = $2, "statusUpdated" = now() - make_interval(secs => $3)
             WHERE "id" = $4 AND "platformId" = $5
               AND ("statusUpdated" IS NULL OR "statusUpdated" < now() - make_interval(secs => $3))
               AND ("status" <> $1 OR "statusUpdated" IS NULL OR "statusUpdated" < now() - make_interval(secs => $6))
             RETURNING "status"`,
            [status, reason, observedSecondsAgo, providerId, platformId, refreshSecondsAgo],
        )

        const applied = Array.isArray(rows) && rows.length > 0
        log.debug({ platform: { id: platformId }, aiProvider: { id: providerId, status }, applied }, '[aiProviderHealth#record] Key status observed')
        return applied ? status : null
    },
})

function secondsSince(observedAt: number | undefined): number {
    if (isNil(observedAt)) {
        return 0
    }
    return Math.max(0, (nextObservedAt() - observedAt) / 1000)
}

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
