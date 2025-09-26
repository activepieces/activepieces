
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const updatedRow = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updatedRow',
    displayName: 'Updated Row',
    description: 'Fires when a row (in a worksheet) is added or updated.',
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