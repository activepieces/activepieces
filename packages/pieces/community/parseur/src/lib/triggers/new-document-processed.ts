
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newDocumentProcessed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newDocumentProcessed',
    displayName: 'New Document Processed',
    description: 'Fires when a new document is successfully processed and parsed by Parseur.',
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