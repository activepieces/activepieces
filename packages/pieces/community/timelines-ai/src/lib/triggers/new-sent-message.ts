
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newSentMessage = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newSentMessage',
    displayName: 'New Sent Message',
    description: 'Fires when a message is sent (outgoing).',
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