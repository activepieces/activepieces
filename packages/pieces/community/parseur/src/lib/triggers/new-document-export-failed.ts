
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newDocumentExportFailed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newDocumentExportFailed',
    displayName: 'New Document Export Failed',
    description: 'Fires when an automated export endpoint (webhook / integration) fails for a processed document.',
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