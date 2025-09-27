
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newOrUpdatedFile = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newOrUpdatedFile',
    displayName: 'New or Updated File',
    description: 'Fires when a file is created or updated in a given folder.',
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