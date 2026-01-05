import { ApplicationEventName, FlowUpdatedEvent } from '@activepieces/ee-shared'
import { BADGES, FlowOperationType, FlowStatus } from '@activepieces/shared'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { BadgeCheck } from '../badge-check'

export const flowsBadgesCheck: BadgeCheck = {
    eval: async ({ event }) => {
        const badges: (keyof typeof BADGES)[] = []
        if (event.action !== ApplicationEventName.FLOW_UPDATED) {
            return badges
        }
        const flowUpdatedEvent = event as FlowUpdatedEvent
        if ([FlowOperationType.LOCK_AND_PUBLISH, FlowOperationType.CHANGE_STATUS].includes(flowUpdatedEvent.data.request.type)) {
            return badges
        }
        const userId = flowUpdatedEvent.userId!

        const activeFlowsCount = await flowRepo().countBy({
            ownerId: userId,
            status: FlowStatus.ENABLED,
        })
        if (activeFlowsCount >= 1) {
            badges.push('first-build')
        }
        if (activeFlowsCount >= 5) {
            badges.push('on-a-roll')
        }
        if (activeFlowsCount >= 10) {
            badges.push('automation-addict')
        }
        if (activeFlowsCount >= 50) {
            badges.push('cant-stop')
        }
        return badges
    },
}

