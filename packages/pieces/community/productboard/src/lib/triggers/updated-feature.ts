
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const updatedFeature = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updatedFeature',
    displayName: 'Updated Feature',
    description: 'Fires when an existing feature is updated.',
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