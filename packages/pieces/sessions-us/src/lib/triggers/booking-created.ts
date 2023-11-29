import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const bookingCreated = createTrigger({
    auth: sessionAuth,
    name: "booking_created",
    displayName: "Booking Created",
    description: "Triggered when a new booking is created.",
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},
    async onEnable(context) {
        //Empty
    },
    async onDisable(context) {
        //Empty
    },
    async run({ payload }) {
        return [payload.body];
    },
});