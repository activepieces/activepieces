
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newMailbox = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newMailbox',
    displayName: 'New Mailbox',
    description: 'Fires when a new mailbox is created in the Parseur account.',
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        // implement webhook creation logic
    },
    async onDisable(context){
        // implement webhook deletion logic
    },
    async run(context){
        return [context.payload.body]
    }
})