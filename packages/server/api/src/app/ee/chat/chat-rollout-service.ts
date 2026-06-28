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

    async recordLanding({ userId, platformId }: { userId: string, platformId: string }): Promise<void> {
        if (!isCloud()) {
            return
        }
        await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt")
             VALUES ($1, $2, $3, now())
             ON CONFLICT ("userId") DO UPDATE
             SET "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()), "updated" = now()`,
            [apId(), userId, platformId],
        )
    },

    async recordChatted({ userId, platformId }: { userId: string, platformId: string }): Promise<void> {
        if (!isCloud()) {
            return
        }
        await rolloutRepo().query(
            `INSERT INTO "chat_rollout_user" ("id", "userId", "platformId", "landedAt", "chattedAt")
             VALUES ($1, $2, $3, now(), now())
             ON CONFLICT ("userId") DO UPDATE
             SET "chattedAt" = COALESCE("chat_rollout_user"."chattedAt", now()),
                 "landedAt" = COALESCE("chat_rollout_user"."landedAt", now()),
                 "updated" = now()`,
            [apId(), userId, platformId],
        )
    },

    async getFunnelAggregate(): Promise<ChatFunnelAggregate> {
        const cap = getCap()
        // Two index-backed counts (partial indexes on landedAt / chattedAt) rather than a
        // single full-table FILTER aggregate.
        const [landed, chatted] = await Promise.all([
            rolloutRepo().count({ where: { landedAt: Not(IsNull()) } }),
            rolloutRepo().count({ where: { chattedAt: Not(IsNull()) } }),
        ])
        return { landed, chatted, cap, closed: chatted >= cap }
    },
}

export type ChatFunnelAggregate = {
    landed: number
    chatted: number
    cap: number
    closed: boolean
}
