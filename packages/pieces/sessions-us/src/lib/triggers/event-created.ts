import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const eventCreated = createTrigger({
    auth: sessionAuth,
    name: "event_created",
    displayName: "Event Created",
    description: "Triggered when a new event is created.",
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