
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newIncomingChat = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newIncomingChat',
    displayName: 'New Incoming Chat',
    description: 'Fires when a new incoming chat (i.e. from a user) is created.',
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