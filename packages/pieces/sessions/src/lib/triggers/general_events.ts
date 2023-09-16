import { sessionAuth } from "../..";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";


export const SessionData = createTrigger({
    auth: sessionAuth,
    name: "session_data",
    displayName: "Session Data",
    description: "Triggers when a data is transferred",
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "session": {
            "id": "197hshdge-2617gdw",
            "name": "sample text here",
            "description": "json data here",
            "quicksession":"false",
            "room":{
                "id":"1111",
                "slug":"twhqfwgqh",
            },
            "booking":{
                "id": "2613178",
                "name": "testing2",
                "participantName": "Sir Test",
                "participantEmail": "testing2@test.com",
                "guests": ["test1","test2"]
            },
            "event":{
                "id":"326178",
                "slug":"6721gegd",
            },

        },
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