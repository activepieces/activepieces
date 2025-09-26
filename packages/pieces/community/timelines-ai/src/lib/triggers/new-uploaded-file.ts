
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newUploadedFile = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newUploadedFile',
    displayName: 'New Uploaded File',
    description: 'Fires when a new file is uploaded in a chat.',
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