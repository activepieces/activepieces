
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newListItem = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newListItem',
    displayName: 'New List Item',
    description: 'Fires when a new item is created in a SharePoint list.',
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