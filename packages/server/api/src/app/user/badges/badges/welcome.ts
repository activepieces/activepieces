import { ApplicationEventName } from '@activepieces/ee-shared'
import { BadgeDefinition } from './badge-definition'

export const welcomeBadge: BadgeDefinition = {
    name: 'welcome',
    eval: ({ event }) => {
        return event.action === ApplicationEventName.USER_SIGNED_UP
    },
}

