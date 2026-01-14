
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const callFinished = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'callFinished',
    displayName: 'Call Finished',
    description: 'Activates the flow after finishing a call for post-processing',
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