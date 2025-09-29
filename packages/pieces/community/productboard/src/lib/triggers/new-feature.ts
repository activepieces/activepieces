
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newFeature = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newFeature',
    displayName: 'New Feature',
    description: 'Fires when a new feature is created in Productboard.',
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