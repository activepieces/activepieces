
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const conversationAbandoned = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'conversationAbandoned',
    displayName: 'Conversation Abandoned',
    description: 'Triggered when website visitor stops interacting with a bot for more than 10 minutes.',
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