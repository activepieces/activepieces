import { apId, isNil } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { distributedStore } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { openRouterApi } from '../platform/platform-plan/openrouter/openrouter-api'
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

    async claimFirstChatGrant({ userId, platformId, log }: { userId: string, platformId: string, log: FastifyBaseLogger }): Promise<void> {
        if (!isCloud()) {
            return
        }
        // Free-tier cloud only: skip if platform has a license key (paid)
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (!isNil(plan.licenseKey)) {
            return
        }
        const result = await rolloutRepo().query(
            `UPDATE "chat_rollout_user"
             SET "grantedFreeCreditAt" = now(), "updated" = now()
             WHERE "userId" = $1 AND "grantedFreeCreditAt" IS NULL`,
            [userId],
        )
        if (result.rowCount > 0) {
            await this.recordFirstChatGrant({ platformId, log })
        }
    },

    async recordFirstChatGrant({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<void> {
        if (!isCloud()) {
            return
        }
        const auth = await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
        const { data: key } = await openRouterApi.getKey({ hash: auth.apiKeyHash })
        await openRouterApi.updateKey({
            hash: auth.apiKeyHash,
            limit: key.limit! + getFreeCreditUsd(),
        })
        log.info({ platform: { id: platformId }, grantAmount: getFreeCreditUsd() }, '[chatRolloutService] Granted free chat credit to first-time chatter')
    },
}
