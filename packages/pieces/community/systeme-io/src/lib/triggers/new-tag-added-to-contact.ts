
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newTagAddedToContact = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newTagAddedToContact',
    displayName: 'New Tag Added to Contact',
    description: 'Fires when a specific tag is assigned to a contact',
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