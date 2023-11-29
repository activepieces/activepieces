import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const bookingEnded = createTrigger({
    auth: sessionAuth,
    name: "booking_ended",
    displayName: "Booking Ended",
    description: "Triggered when a booking ends.",
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},
    async onEnable(context) {
        //Empty
    },
    async onDisable(context) {
        //Empty
    },
    async run(context) {
        const body = context.payload.body;
        return [body];
    },
});