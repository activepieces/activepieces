import { ApplicationEventName } from '@activepieces/ee-shared'
import { BadgeCheck } from '../badge-check'

export const welcomeBadge: BadgeCheck = {
    name: 'welcome',
    eval: async ({ event }) => {
        return event.action === ApplicationEventName.USER_SIGNED_UP
    },
}
