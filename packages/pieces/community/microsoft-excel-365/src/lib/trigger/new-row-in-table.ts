
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newRowInTable = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newRowInTable',
    displayName: 'New Row in Table',
    description: 'Fires when a new row is added to a table within a worksheet.',
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