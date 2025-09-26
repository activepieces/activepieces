
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newWorksheet = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newWorksheet',
    displayName: 'New Worksheet',
    description: 'Fires when a new worksheet is created in a workbook.',
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