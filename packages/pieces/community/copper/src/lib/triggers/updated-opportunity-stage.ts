
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const updated-opportunity-stage = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'updated-opportunity-stage',
    displayName: 'updated-opportunity-stage',
    description: '',
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