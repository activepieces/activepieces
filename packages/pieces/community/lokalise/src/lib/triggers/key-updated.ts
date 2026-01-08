
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const keyUpdated = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'keyUpdated',
    displayName: 'Key Updated',
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