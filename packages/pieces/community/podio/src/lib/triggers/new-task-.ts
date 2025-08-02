
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newTask	 = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newTask	',
    displayName: 'New Task	',
    description: 'Fires when a new task is added to any workspace.',
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