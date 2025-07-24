
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newItem = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newItem',
    displayName: 'New Item',
    description: 'Fires when a new item (record/entry) is created in an app.',
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