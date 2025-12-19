
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const emailClicked = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'emailClicked',
    displayName: 'Email Clicked',
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