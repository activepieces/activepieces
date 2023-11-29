import { sessionAuth } from "@activepieces/piece-sessions-us";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";

export const sessionStarted = createTrigger({
    auth: sessionAuth,
    name: "session_started",
    displayName: "Session Started",
    description: "Triggered when a session starts.",
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