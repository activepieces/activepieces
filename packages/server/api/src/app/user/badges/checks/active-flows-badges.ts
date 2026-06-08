import { ApplicationEvent, ApplicationEventName, BADGES, FlowOperationType, FlowStatus, FlowUpdatedEvent, isNil } from '@activepieces/shared'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { BadgeCheck, BadgeCheckResult } from '../badge-check'

export const flowsBadgesCheck: BadgeCheck = {
    eval: async (event: ApplicationEvent): Promise<BadgeCheckResult> => {
        const userId = event.userId
        if (event.action !== ApplicationEventName.FLOW_UPDATED) {
            return { userId: null, badges: [] }
        }
        const flowUpdatedEvent = event as FlowUpdatedEvent
        const requestType = flowUpdatedEvent.data.request['type'] as FlowOperationType
        if (![FlowOperationType.LOCK_AND_PUBLISH, FlowOperationType.CHANGE_STATUS].includes(requestType)) {
            return { userId: null, badges: [] }
        }
        const currentFlowId = flowUpdatedEvent.data.flowVersion['flowId'] as string
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
        const nestedRequest = flowUpdatedEvent.data.request['request'] as Record<string, unknown> | undefined
        const turnTheFlowOn = requestType === FlowOperationType.CHANGE_STATUS && nestedRequest?.['status'] === FlowStatus.ENABLED
        if ((requestType === FlowOperationType.LOCK_AND_PUBLISH || turnTheFlowOn)) {
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

