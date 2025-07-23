
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newSale = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newSale',
    displayName: 'New Sale',
    description: 'Fires when a new purchase is made within a funnel',
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