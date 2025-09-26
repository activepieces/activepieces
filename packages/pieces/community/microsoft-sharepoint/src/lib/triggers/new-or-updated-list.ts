
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newOrUpdatedList = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newOrUpdatedList',
    displayName: 'New or Updated List',
    description: 'Fires when a list itself is updated.',
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