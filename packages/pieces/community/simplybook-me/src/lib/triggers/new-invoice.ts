
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newInvoice = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newInvoice',
    displayName: 'New Invoice',
    description: 'Fires when a new invoice is generated/paid (with Accept Payments feature).',
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