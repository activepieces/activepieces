import { ApplicationEventName, FlowUpdatedEvent } from '@activepieces/ee-shared'
import { BADGES, FlowOperationType, FlowStatus, isNil } from '@activepieces/shared'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { BadgeCheck, BadgeCheckResult } from '../badge-check'

export const flowsBadgesCheck: BadgeCheck = {
    eval: async ({ event, userId }): Promise<BadgeCheckResult> => {
        if (event.action !== ApplicationEventName.FLOW_UPDATED) {
            return { userId: null, badges: [] }
        }
        const flowUpdatedEvent = event as FlowUpdatedEvent
        if (![FlowOperationType.LOCK_AND_PUBLISH, FlowOperationType.CHANGE_STATUS].includes(flowUpdatedEvent.data.request.type)) {
            return { userId: null, badges: [] }
        }
        const currentFlowId = flowUpdatedEvent.data.flowVersion.flowId
        if (isNil(currentFlowId)) {
            return { userId: null, badges: [] }
        }
        if (isNil(userId)) {
            return { userId: null, badges: [] }
        }
        const badges: (keyof typeof BADGES)[] = []
        const activeFlows = await flowRepo().find({
            select: ['id'],
            where: {
                ownerId: userId,
                status: FlowStatus.ENABLED,
            },
        })
        const uniqueActiveFlows = new Set(activeFlows.map(flow => flow.id))
        const turnTheFlowOn = flowUpdatedEvent.data.request.type === FlowOperationType.CHANGE_STATUS && flowUpdatedEvent.data.request.request.status === FlowStatus.ENABLED
        if ((flowUpdatedEvent.data.request.type === FlowOperationType.LOCK_AND_PUBLISH || turnTheFlowOn)) {
            uniqueActiveFlows.add(currentFlowId)
        }
        else {
            uniqueActiveFlows.delete(currentFlowId)
        }

        if (uniqueActiveFlows.size >= 1) {
            badges.push('first-build')
        }
        if (uniqueActiveFlows.size >= 5) {
            badges.push('on-a-roll')
        }
        if (uniqueActiveFlows.size >= 10) {
            badges.push('automation-addict')
        }
        if (uniqueActiveFlows.size >= 50) {
            badges.push('cant-stop')
        }
        return { userId, badges }
    },
}

