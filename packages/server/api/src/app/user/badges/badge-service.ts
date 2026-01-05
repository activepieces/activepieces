import { apId, isNil, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { websocketService } from '../../core/websockets.service'
import { applicationEvents } from '../../helper/application-events'
import { UserBadgeEntity } from './badge-entity'
import { allBadges } from './checks'

export const userBadgeRepo = repoFactory(UserBadgeEntity)

export const userBadgeService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents.registerListeners(log, {
            userEvent: () => async (requestInformation, event) => {
                const userId = requestInformation.userId
                if (isNil(userId)) {
                    return
                }
                const badgesToAward = (await Promise.all(allBadges.map(badgeCheck => badgeCheck.eval({ requestInformation, event })))).flatMap(badge => badge)
                if (badgesToAward.length === 0) {
                    return
                }
                const existingBadges = await userBadgeRepo().findBy({
                    userId,
                    name: In(badgesToAward),
                })
                const newBadges = badgesToAward.filter(badge => !existingBadges.some(existingBadge => existingBadge.name === badge))
                for (const badgeName of badgesToAward) {
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
            },
            workerEvent: () => () => {
                // No badge actions for worker events
            },
        })
    },
})

