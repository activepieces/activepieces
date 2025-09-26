
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newFileInFolder = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newFileInFolder',
    displayName: 'New File in Folder',
    description: 'Fires when a new file is created or added in a specific folder.',
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