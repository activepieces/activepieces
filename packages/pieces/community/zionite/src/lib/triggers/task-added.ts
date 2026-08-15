
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const taskAdded = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'taskAdded',
    displayName: 'task added',
    description: 'when new task is added ',
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