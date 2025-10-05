
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const bookingChange = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'bookingChange',
    displayName: 'Booking Change',
    description: 'Fires when booking details change (date, time, service, provider, status, intake form answers).',
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