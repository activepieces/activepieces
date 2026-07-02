import { apId, isNil } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { IsNull, Not } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { distributedStore } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { ChatRolloutUserEntity } from './chat-rollout-user-entity'

const DEFAULT_ROLLOUT_CAP = 200
// Monotonic: once the cap is reached the rollout never reopens, so we cache the
// closed state and stop counting on every gate check.
const ROLLOUT_CLOSED_KEY = 'chat-rollout:closed'

const rolloutRepo = repoFactory(ChatRolloutUserEntity)

function getCap(): number {
    return system.getNumber(AppSystemProp.CLOUD_CHAT_ROLLOUT_CAP) ?? DEFAULT_ROLLOUT_CAP
}

function isCloud(): boolean {
    return !isNotOneOfTheseEditions([ApEdition.CLOUD])
}

function getFreeCreditUsd(): number {
    return system.getNumber(AppSystemProp.CLOUD_CHAT_FREE_CREDIT_USD) ?? 10
}

async function countChatted(): Promise<number> {
    return rolloutRepo().count({ where: { chattedAt: Not(IsNull()) } })
}

async function countLanded(): Promise<number> {
    return rolloutRepo().count({ where: { landedAt: Not(IsNull()) } })
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

    // Records that a user opened the chat page. Sets landedAt without touching chattedAt, so a user
    // who lands but never sends a message still counts toward "landed" (landed >= chatted).
    async recordLanding({ userId, platformId }: { userId: string, platformId: string }): Promise<void> {
        if (!isCloud()) {
            return
        }
        await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt")
             VALUES ($1, $2, $3, now())
             ON CONFLICT ("userId") DO UPDATE
             SET "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()),
                 "updated" = now()`,
            [apId(), userId, platformId],
        )
    },

    // Authoritative funnel snapshot for the console rollout dashboard. landed/chatted come from the
    // same table that drives the cap, so the numbers always match the auto-close.
    async getFunnelSnapshot(): Promise<{ landed: number, chatted: number, cap: number, closed: boolean }> {
        if (!isCloud()) {
            return { landed: 0, chatted: 0, cap: getCap(), closed: false }
        }
        const cap = getCap()
        const [landed, chatted] = await Promise.all([countLanded(), countChatted()])
        // Derive closed from the count we already fetched rather than calling isRolloutOpen(), which
        // would COUNT chatted a second time. Read-only: the monotonic Redis closed flag is maintained
        // by recordChatted() when the cap is first reached.
        return { landed, chatted, cap, closed: chatted >= cap }
    },

    async recordChatted({ userId, platformId }: { userId: string, platformId: string }): Promise<{ firstChat: boolean, needsCreditDecision: boolean }> {
        if (!isCloud()) {
            return { firstChat: false, needsCreditDecision: false }
        }
        // Rows only ever exist once a user has chatted, so an INSERT (xmax = 0) is the first message.
        // needsCreditDecision stays true until the one-time free-credit decision is settled, so the
        // grant is retried on later messages if it failed (not gated on the one-shot firstChat).
        const rows = await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt", "chattedAt")
             VALUES ($1, $2, $3, now(), now())
             ON CONFLICT ("userId") DO UPDATE
             SET "chattedAt" = COALESCE("chat_rollout_user"."chattedAt", now()),
                 "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()),
                 "updated" = now()
             RETURNING (xmax = 0) AS inserted, ("grantedFreeCreditAt" IS NULL) AS needs_credit_decision`,
            [apId(), userId, platformId],
        )
        const firstChat = rows[0]?.inserted === true
        const needsCreditDecision = rows[0]?.needs_credit_decision === true
        // Close the rollout the moment the cap is reached, not lazily on the next gate check.
        if (firstChat && (await countChatted()) >= getCap()) {
            await distributedStore.putBoolean(ROLLOUT_CLOSED_KEY, true)
        }
        return { firstChat, needsCreditDecision }
    },

    // Atomically settle the one-time free-credit decision for a user. Returns true only for the
    // caller that flips grantedFreeCreditAt from NULL, so the decision (grant for free-tier, or a
    // no-op skip for paid) is processed exactly once even under concurrent messages.
    async claimFreeCreditGrant({ userId }: { userId: string }): Promise<boolean> {
        if (!isCloud()) {
            return false
        }
        const rows = await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = now(), "updated" = now()
             WHERE "userId" = $1 AND "grantedFreeCreditAt" IS NULL
             RETURNING "id"`,
            [userId],
        )
        return rows.length > 0
    },

    // Release a claim so a later message can retry when the credit top-up itself failed.
    async releaseFreeCreditGrant({ userId }: { userId: string }): Promise<void> {
        if (!isCloud()) {
            return
        }
        await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = NULL, "updated" = now()
             WHERE "userId" = $1`,
            [userId],
        )
    },


}
