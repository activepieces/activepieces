
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newFileInSubfolders = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newFileInSubfolders',
    displayName: 'New File in Subfolders',
    description: 'Fires when a new file is added anywhere in the first-level subfolders of a folder.',
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
