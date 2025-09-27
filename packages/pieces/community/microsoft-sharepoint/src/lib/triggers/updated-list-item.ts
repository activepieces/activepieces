
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const updatedListItem = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updatedListItem',
    displayName: 'Updated List Item',
    description: 'Fires when an existing item in a SharePoint list is updated.',
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