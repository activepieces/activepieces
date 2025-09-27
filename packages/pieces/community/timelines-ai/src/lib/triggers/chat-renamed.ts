
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const chatRenamed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'chatRenamed',
    displayName: 'Chat Renamed',
    description: 'Fires when a chat is renamed.',
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