
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newOrUpdatedFolder = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newOrUpdatedFolder',
    displayName: 'New or Updated Folder',
    description: 'Fires when a folder is created or updated (name change, properties).',
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