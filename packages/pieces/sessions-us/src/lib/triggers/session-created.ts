import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const sessionCreated = createTrigger({
    auth: sessionAuth,
    name: "session_created",
    displayName: "Session Created",
    description: "Triggered when a new session is created.",
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