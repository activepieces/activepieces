
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const updatedRecord = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updatedRecord',
    displayName: 'Updated Record',
    description: 'Fires when an existing record is updated.',
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