
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const company-custom-field-updated = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'company-custom-field-updated',
    displayName: 'company-custom-field-updated',
    description: '',
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