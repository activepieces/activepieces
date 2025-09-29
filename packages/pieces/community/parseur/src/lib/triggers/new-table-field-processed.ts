
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newTableFieldProcessed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newTableFieldProcessed',
    displayName: 'New Table Field Processed',
    description: 'Fires when a document with table fields is processed, and triggers for each row (table field) separately.',
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