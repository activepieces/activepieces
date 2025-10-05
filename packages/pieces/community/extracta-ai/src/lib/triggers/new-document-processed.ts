
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newDocumentProcessed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newDocumentProcessed',
    displayName: 'New Document Processed',
    description: 'Fires when a document (file upload) has been processed and extraction results are available.',
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