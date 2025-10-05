
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newClient = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newClient',
    displayName: 'New Client',
    description: 'Fires when a new client is added (via booking or manually).',
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