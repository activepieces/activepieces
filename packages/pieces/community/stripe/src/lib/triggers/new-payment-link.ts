
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newPaymentLink = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newPaymentLink',
    displayName: 'New Payment Link',
    description: 'Triggers when a new Payment Link is created.',
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