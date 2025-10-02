
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newRecord = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newRecord',
    displayName: 'New Record',
    description: 'Fires when a new record is created in Insightly (for a specified object).',
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