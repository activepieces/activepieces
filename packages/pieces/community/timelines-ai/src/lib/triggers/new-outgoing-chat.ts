
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newOutgoingChat = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newOutgoingChat',
    displayName: 'New Outgoing Chat',
    description: 'Fires when a new outgoing chat is initiated.',
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