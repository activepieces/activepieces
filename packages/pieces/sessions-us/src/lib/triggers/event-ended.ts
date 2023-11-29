import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const eventEnded = createTrigger({
    auth: sessionAuth,
    name: "event_ended",
    displayName: "Event Ended",
    description: "Triggered when an event ends.",
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