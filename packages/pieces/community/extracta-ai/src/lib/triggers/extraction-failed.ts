
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const extractionFailed = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'extractionFailed',
    displayName: 'Extraction Failed',
    description: 'Fires when a extraction of a document is failed.',
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