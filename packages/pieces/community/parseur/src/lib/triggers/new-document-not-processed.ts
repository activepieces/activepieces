
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newDocumentNotProcessed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newDocumentNotProcessed',
    displayName: 'New Document Not Processed',
    description: 'Fires when Parseur fails to parse a document (e.g. no matching template).',
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