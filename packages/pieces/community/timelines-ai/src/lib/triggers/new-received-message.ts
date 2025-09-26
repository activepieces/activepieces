
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newReceivedMessage = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newReceivedMessage',
    displayName: 'New Received Message',
    description: 'Fires when a message is received (incoming).',
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