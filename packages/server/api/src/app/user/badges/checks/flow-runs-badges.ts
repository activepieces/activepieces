import { ApplicationEventName, FlowRunEvent } from '@activepieces/ee-shared'
import { BADGES, FlowRunStatus, isFailedState, isNil, RunEnvironment } from '@activepieces/shared'
import { BadgeCheck, BadgeCheckResult } from '../badge-check'

export const flowRunsBadgesCheck: BadgeCheck = {
    eval: async ({ event }): Promise<BadgeCheckResult> => {
        const badges: (keyof typeof BADGES)[] = []

        if (event.action !== ApplicationEventName.FLOW_RUN_FINISHED) {
            return { userId: null, badges }
        }
        const flowRunEvent = event as FlowRunEvent
        if (flowRunEvent.data.flowRun.environment !== RunEnvironment.TESTING || !isNil(flowRunEvent.data.flowRun.stepNameToTest)) {
            return { userId: null, badges }
        }
        const triggeredBy = flowRunEvent.data.flowRun.triggeredBy
        if (isNil(triggeredBy)) {
            return { userId: null, badges }
        }
        const status = flowRunEvent.data.flowRun.status

        if (isFailedState(status)) {
            badges.push('back-again')
        }

        if (status === FlowRunStatus.SUCCEEDED) {
            badges.push('victory')
        }

        return { userId: triggeredBy, badges }
    },
}

