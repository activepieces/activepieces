import { apId, BADGES, isNil, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { websocketService } from '../../core/websockets.service'
import { applicationEvents, AuditEventParam } from '../../helper/application-events'
import { BadgeCheck } from './badge-check'
import { UserBadgeEntity } from './badge-entity'
import { flowsBadgesCheck } from './checks/active-flows-badges'
import { flowContentBadgesCheck } from './checks/flow-content'
import { flowRunsBadgesCheck } from './checks/flow-runs-badges'

export const userBadgeRepo = repoFactory(UserBadgeEntity)

const userEventsChecks: BadgeCheck[] = [
    flowsBadgesCheck,
    flowContentBadgesCheck,
]

const workerEventsChecks: BadgeCheck[] = [
    flowRunsBadgesCheck,
]

async function processBadgeChecks(
    checks: BadgeCheck[],
    userId: string | undefined,
    event: AuditEventParam,
    log: FastifyBaseLogger,
): Promise<void> {
    const checkResults = await Promise.all(checks.map(badgeCheck => badgeCheck.eval({ userId, event })))

    const badgesByUser = new Map<string, (keyof typeof BADGES)[]>()
    for (const result of checkResults) {
        if (isNil(result.userId) || result.badges.length === 0) {
            continue
        }
        const existing = badgesByUser.get(result.userId) ?? []
        badgesByUser.set(result.userId, [...existing, ...result.badges])
    }

    for (const [userId, badgesToAward] of badgesByUser) {
        const existingBadges = await userBadgeRepo().findBy({
            userId,
            name: In(badgesToAward),
        })
        const newBadges = badgesToAward.filter(badge => !existingBadges.some(existingBadge => existingBadge.name === badge))
        for (const badgeName of newBadges) {
            await userBadgeRepo().upsert(
                {
                    id: apId(),
                    userId,
                    name: badgeName,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                },
                ['userId', 'name'],
            )
            log.info({
                message: 'Awarding badge',
                badgeName,
                userId,
            })
            websocketService.to(userId).emit(WebsocketClientEvent.BADGE_AWARDED, {
                badge: badgeName,
                userId,
            })
        }
    }
}

export const userBadgeService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents.registerListeners(log, {
            userEvent: () => async (requestInformation, event) => {
                await processBadgeChecks(userEventsChecks, requestInformation.userId, event, log)
            },
            workerEvent: () => async (_projectId, event) => {
                await processBadgeChecks(workerEventsChecks, undefined, event, log)
            },
        })
    },
})

