import { apId } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { IsNull, Not } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { ChatRolloutUserEntity } from './chat-rollout-user-entity'

const rolloutRepo = repoFactory(ChatRolloutUserEntity)

function isCloud(): boolean {
    return !isNotOneOfTheseEditions([ApEdition.CLOUD])
}

async function countChatted(): Promise<number> {
    return rolloutRepo().count({ where: { chattedAt: Not(IsNull()) } })
}

async function countLanded(): Promise<number> {
    return rolloutRepo().count({ where: { landedAt: Not(IsNull()) } })
}

export const chatRolloutService = {
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

    async getFunnelSnapshot(): Promise<{ landed: number, chatted: number }> {
        if (!isCloud()) {
            return { landed: 0, chatted: 0 }
        }
        const [landed, chatted] = await Promise.all([countLanded(), countChatted()])
        return { landed, chatted }
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
}
