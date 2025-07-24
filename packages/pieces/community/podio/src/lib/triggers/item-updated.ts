
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const itemUpdated = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'itemUpdated',
    displayName: 'Item Updated',
    description: 'Fires when an existing item is updated (excluding comments).',
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