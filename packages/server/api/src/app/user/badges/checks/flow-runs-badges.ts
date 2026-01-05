import { ApplicationEventName, FlowRunEvent } from '@activepieces/ee-shared'
import { BADGES, FlowRunStatus, isFailedState, isNil, RunEnvironment } from '@activepieces/shared'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { BadgeCheck, BadgeCheckResult } from '../badge-check'

export const flowRunsBadgesCheck: BadgeCheck = {
    eval: async ({ event }): Promise<BadgeCheckResult> => {
        const badges: (keyof typeof BADGES)[] = []

        if (event.action !== ApplicationEventName.FLOW_RUN_FINISHED) {
            return { userId: null, badges }
        }
        const flowRunEvent = event as FlowRunEvent
        if (flowRunEvent.data.flowRun.environment !== RunEnvironment.PRODUCTION) {
            return { userId: null, badges }
        }
        const flow = await flowRepo().findOne({
            select: ['ownerId'],
            where: {
                id: flowRunEvent.data.flowRun.flowId,
            },
        })
        const ownerId = flow?.ownerId
        if (isNil(ownerId)) {
            return { userId: null, badges }
        }
        const status = flowRunEvent.data.flowRun.status

        if (isFailedState(status)) {
            badges.push('back-again')
        }

        if (status === FlowRunStatus.SUCCEEDED) {
            badges.push('victory')
        }

        return { userId: ownerId, badges }
    },
}

