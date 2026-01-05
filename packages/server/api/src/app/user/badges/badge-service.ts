import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { apId, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { applicationEvents } from '../../helper/application-events'
import { UserBadgeEntity } from './badge-entity'
import { allBadges } from './checks'

export const userBadgeRepo = repoFactory(UserBadgeEntity)

export const userBadgeService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents.registerListeners(log, {
            userEvent: () => async (requestInformation, event) => {
                if (!requestInformation.userId) {
                    return
                }
                for (const badge of allBadges) {
                    const userId = requestInformation.userId
                    const shouldAward = !isNil(userId) && await badge.eval({ requestInformation, event })
                    if (shouldAward) {
                        awardBadge(userId, badge.name, log)
                    }
                }
            },
            workerEvent: () => () => {
                // No badge actions for worker events
            },
        })
    },
})

function awardBadge(userid: string, badgeName: string, log: FastifyBaseLogger) {
    rejectedPromiseHandler(
        userBadgeRepo().upsert(
            {
                id: apId(),
                userId: userid,
                name: badgeName,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            },
            ['userId', 'name'],
        ),
        log,
    )
}