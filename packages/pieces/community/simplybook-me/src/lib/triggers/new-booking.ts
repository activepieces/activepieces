
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const newBooking = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newBooking',
    displayName: 'New Booking',
    description: 'Fires when a new booking is created in SimplyBook.me.',
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