import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'

export const UserBadge = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    userId: Type.String(),

})

export type UserBadge = Static<typeof UserBadge>

export const BADGES = {
    'first-build': {
        imageUrl: 'https://cdn.activepieces.com/badges/first-build.gif',
        title: 'First Build',
        description: 'I had published my first flow and automation is officially real.',
    },
    'on-a-roll': {
        imageUrl: 'https://cdn.activepieces.com/badges/on-a-roll.gif',
        title: 'On a Roll',
        description: 'I have 5 active flows and I\'m getting the hang of this.',
    },
    'automation-addict': {
        imageUrl: 'https://cdn.activepieces.com/badges/automation-addict.gif',
        title: 'Automation Addict',
        description: 'I have 10 active flows and I\'m basically an automation pro.',
    },
    'cant-stop': {
        imageUrl: 'https://cdn.activepieces.com/badges/cant-stop.gif',
        title: 'Can\'t Stop',
        description: 'I have 50 active flows and automation just happens around me.',
    },
    'webhook-wizard': {
        imageUrl: 'https://cdn.activepieces.com/badges/webhook-wizard.gif',
        title: 'Webhook Wizard',
        description: 'I used webhooks and my triggers are endless now.',
    },
    'agentic-genius': {
        imageUrl: 'https://cdn.activepieces.com/badges/agentic-genius.gif',
        title: 'Agentic Genius',
        description: 'I used AI and my automation just got smarter.',
    },
    'coding-chad': {
        imageUrl: 'https://cdn.activepieces.com/badges/coding-chad.gif',
        title: 'Coding Chad',
        description: 'I used custom code and made my flow do tricks no one else can.',
    },
    'back-again': {
        imageUrl: 'https://cdn.activepieces.com/badges/back-again.gif',
        title: 'Back Again',
        description: 'I tested a flow and it failed to run... but I learned something valuable.',
    },
    'victory': {
        imageUrl: 'https://cdn.activepieces.com/badges/victory.gif',
        title: 'Victory',
        description: 'I tested a flow and it ran successfully... the joy is real!',
    },
} as const
