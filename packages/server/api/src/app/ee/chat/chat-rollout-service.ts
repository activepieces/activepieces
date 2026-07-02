import { apId, isNil } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { distributedStore } from '../../database/redis-connections'
import { platformAiCreditsService } from '../platform/platform-plan/platform-ai-credits.service'
import { flagService } from '../../flags/flag.service'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { ChatRolloutUserEntity } from './chat-rollout-user-entity'

const DEFAULT_ROLLOUT_CAP = 200
const DEFAULT_FREE_CREDIT_USD = 10
// Monotonic: once the cap is reached the rollout never reopens, so we cache the
// closed state and stop counting on every gate check.
const ROLLOUT_CLOSED_KEY = 'chat-rollout:closed'

const rolloutRepo = repoFactory(ChatRolloutUserEntity)

function getCap(): number {
    return system.getNumber(AppSystemProp.CLOUD_CHAT_ROLLOUT_CAP) ?? DEFAULT_ROLLOUT_CAP
}

function getFreeCreditUsd(): number {
    return system.getNumber(AppSystemProp.CLOUD_CHAT_FREE_CREDIT_USD) ?? DEFAULT_FREE_CREDIT_USD
}

function isCloud(): boolean {
    return !isNotOneOfTheseEditions([ApEdition.CLOUD])
}

async function countChatted(): Promise<number> {
    return rolloutRepo().count({ where: { chattedAt: Not(IsNull()) } })
}

export const chatRolloutService = {
    async isRolloutOpen(): Promise<boolean> {
        if (!isCloud()) {
            return false
        }
        const closed = await distributedStore.getBoolean(ROLLOUT_CLOSED_KEY)
        if (closed === true) {
            return false
        }
        const open = (await countChatted()) < getCap()
        if (!open) {
            await distributedStore.putBoolean(ROLLOUT_CLOSED_KEY, true)
        }
        return open
    },

    async hasUserChatted({ userId }: { userId: string }): Promise<boolean> {
        if (!isCloud()) {
            return false
        }
        // Pure lookup on the unique userId index (at most one row), then read chattedAt.
        const row = await rolloutRepo().findOne({ where: { userId }, select: ['chattedAt'] })
        return !isNil(row) && !isNil(row.chattedAt)
    },

    async recordChatted({ userId, platformId }: { userId: string, platformId: string }): Promise<{ firstChat: boolean }> {
        if (!isCloud()) {
            return { firstChat: false }
        }
        const existing = await rolloutRepo().findOne({ where: { userId }, select: ['chattedAt', 'id'] })
        const wasFirstChat = isNil(existing) || isNil(existing.chattedAt)
        await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt", "chattedAt")
             VALUES ($1, $2, $3, now(), now())
             ON CONFLICT ("userId") DO UPDATE
             SET "chattedAt" = COALESCE("chat_rollout_user"."chattedAt", now()),
                 "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()),
                 "updated" = now()`,
            [apId(), userId, platformId],
        )
        return { firstChat: wasFirstChat }
    },

    // Grants a one-time free credit top-up to a free-tier cloud user on their first chat.
    // Idempotent: the UPDATE WHERE grantedFreeCreditAt IS NULL ensures at most one grant per user.
    async grantFreeCreditIfEligible({ userId, platformId, log }: { userId: string, platformId: string, log: FastifyBaseLogger }): Promise<void> {
        if (!isCloud() || !flagService(log).aiCreditsEnabled()) {
            return
        }

        // Atomically claim the free credit grant for this user.
        const result = await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = now()
             WHERE "userId" = $1 AND "grantedFreeCreditAt" IS NULL
             RETURNING *`,
            [userId],
        )

        const claimed = result?.length > 0
        if (!claimed) {
            // Already granted or no row exists (user hasn't chatted yet — shouldn't happen,
            // but bail gracefully).
            return
        }

        // Grant the free credit via OpenRouter top-up.
        const amountUsd = getFreeCreditUsd()
        try {
            await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
            await platformAiCreditsService(log).aiCreditsPaymentSucceeded(platformId, amountUsd, 'free_credit_grant' as never)
            log.info(
                { userId, platformId, amountUsd },
                '[chatRolloutService] Free credit grant succeeded',
            )
        }
        catch (error: unknown) {
            // Release the claim so the grant can be retried on next chat.
            await rolloutRepo().update(
                { userId },
                { grantedFreeCreditAt: null },
            )
            exceptionHandler.handle(error, log)
            log.warn(
                { userId, platformId, amountUsd },
                '[chatRolloutService] Free credit grant failed, claim released for retry',
            )
        }
    },
}
