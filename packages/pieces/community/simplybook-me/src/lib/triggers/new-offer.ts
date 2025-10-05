
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newOffer = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newOffer',
    displayName: 'New Offer',
    description: 'Fires when a new offer (proposal or quote) is created.',
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