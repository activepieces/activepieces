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
        // INSERT ... ON CONFLICT DO UPDATE RETURNING xmax:
        // xmax = '0' means a new row was inserted (first chat for this user)
        // xmax != '0' means an update happened (user already existed, subsequent chat)
        const result = await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt", "chattedAt")
             VALUES ($1, $2, $3, now(), now())
             ON CONFLICT ("userId") DO UPDATE
             SET "chattedAt" = COALESCE("chat_rollout_user"."chattedAt", now()),
                 "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()),
                 "updated" = now()
             RETURNING xmax::text AS xmax`,
            [apId(), userId, platformId],
        )
        const row = result[0] as { xmax: string } | undefined
        return { firstChat: row?.xmax === '0' }
    },

    async claimFreeCreditGrant({ userId }: { userId: string }): Promise<boolean> {
        if (!isCloud()) {
            return false
        }
        // Atomically claim the free credit grant — only succeeds if not already granted
        const result = await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = now()
             WHERE "userId" = $1 AND "grantedFreeCreditAt" IS NULL
             RETURNING id`,
            [userId],
        )
        return result.length > 0
    },

    async releaseFreeCreditGrant({ userId }: { userId: string }): Promise<void> {
        if (!isCloud()) {
            return
        }
        await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = NULL
             WHERE "userId" = $1`,
            [userId],
        )
    },
}
