import { ApplicationEvent, ApplicationEventName, BADGES, FlowRunEvent, FlowRunStatus, isFailedState, isNil, RunEnvironment } from '@activepieces/shared'
import { BadgeCheck, BadgeCheckResult } from '../badge-check'

export const flowRunsBadgesCheck: BadgeCheck = {
    eval: async (event: ApplicationEvent): Promise<BadgeCheckResult> => {
        const badges: (keyof typeof BADGES)[] = []

        if (event.action !== ApplicationEventName.FLOW_RUN_FINISHED) {
            return { userId: null, badges }
        }
        const flowRunEvent = event as FlowRunEvent
        const flowRun = flowRunEvent.data.flowRun as Record<string, unknown>
        if (flowRun['environment'] !== RunEnvironment.TESTING || !isNil(flowRun['stepNameToTest'])) {
            return { userId: null, badges }
        }
        const triggeredBy = flowRun['triggeredBy'] as string | null | undefined
        if (isNil(triggeredBy)) {
            return { userId: null, badges }
        }
        const status = flowRun['status'] as FlowRunStatus

        if (isFailedState(status)) {
            badges.push('back-again')
        }

        if (status === FlowRunStatus.SUCCEEDED) {
            badges.push('victory')
        }

        return { userId: triggeredBy, badges }
    },
}

