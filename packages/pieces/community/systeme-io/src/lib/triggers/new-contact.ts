
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newContact = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newContact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created',
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