import { ApplicationEventName, FlowRunEvent } from '@activepieces/ee-shared'
import { BADGES, FlowRunStatus, isFailedState } from '@activepieces/shared'
import { BadgeCheck } from '../badge-check'

export const flowRunsBadgesCheck: BadgeCheck = {
    eval: async ({ event }) => {
        const badges: (keyof typeof BADGES)[] = []

        if (event.action !== ApplicationEventName.FLOW_RUN_FINISHED) {
            return badges
        }

        const flowRunEvent = event as FlowRunEvent
        const status = flowRunEvent.data.flowRun.status

        if (isFailedState(status)) {
            badges.push('back-again')
        }

        if (status === FlowRunStatus.SUCCEEDED) {
            badges.push('victory')
        }

        return badges
    },
}

