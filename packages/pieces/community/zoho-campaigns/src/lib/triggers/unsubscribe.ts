
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const unsubscribe = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'unsubscribe',
    displayName: 'Unsubscribe',
    description: 'Fires when a contact is removed from a mailing list or unsubscribed.',
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