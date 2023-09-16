import { sessionAuth } from "../..";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";


export const transcriptReady = createTrigger({
    auth: sessionAuth,
    name: "transcript_ready",
    displayName: "Transcript Ready",
    description: "Triggers when a transcript is ready",
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "session": {
            "id": "197hshdge-2617gdw",
            "takeawaysText": "sample text here",
            "takeawaysRaw": "json data here",
        }
    },
    async onEnable(context){
        const url = context.webhookUrl;
        await context.store.put("webhook",url);

    },
    async onDisable(context){
        const url = context.webhookUrl
        await context.store.put("webhook",url);

    },
    async run(context) {
        const body = context.payload.body;
        return body;
    },
});