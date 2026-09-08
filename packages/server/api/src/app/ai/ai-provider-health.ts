import { AiProviderKeyStatus, classifyProviderOutcome, isNil, PlatformId, ProviderOutcomeSignal } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const MAX_REASON_LENGTH = 300

const REFRESH_UNCHANGED_AFTER_MINUTES = 15

export const aiProviderHealth = (log: FastifyBaseLogger) => ({
    async record({ platformId, providerId, signal, throttled = true, expectVersion }: RecordParams): Promise<AiProviderKeyStatus | null> {
        const status = classifyProviderOutcome(signal)
        if (status === 'no_change') {
            return null
        }
        const reason = status === 'active' ? null : buildReason(signal)
        const refreshAfterMinutes = throttled ? REFRESH_UNCHANGED_AFTER_MINUTES : 0
        const rows = await aiProviderRepo().query(
            `UPDATE "ai_provider"
             SET "status" = $1, "statusReason" = $2, "statusUpdated" = now(), "statusVersion" = "statusVersion" + 1
             WHERE "id" = $3 AND "platformId" = $4
               AND ("status" <> $1
                    OR "statusUpdated" IS NULL
                    OR "statusUpdated" <= now() - make_interval(mins => $5))
               AND ($6::integer IS NULL OR "statusVersion" = $6::integer)
             RETURNING "status"`,
            [status, reason, providerId, platformId, refreshAfterMinutes, expectVersion ?? null],
        )

        const applied = Array.isArray(rows) && rows.length > 0
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
    expectVersion?: number
}
