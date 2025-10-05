
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const bookingCancellation = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'bookingCancellation',
    displayName: 'Booking Cancellation',
    description: 'Fires when a booking is canceled.',
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