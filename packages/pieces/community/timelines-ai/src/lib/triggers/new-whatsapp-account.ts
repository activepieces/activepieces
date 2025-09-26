
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newWhatsappAccount = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newWhatsappAccount',
    displayName: 'New WhatsApp Account',
    description: 'Fires when a new WhatsApp account is added/registered.',
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