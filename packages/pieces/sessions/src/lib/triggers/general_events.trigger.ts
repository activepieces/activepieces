import { sessionAuth } from "../..";
import { createTrigger, PieceAuth, Property, TriggerStrategy } from "@activepieces/pieces-framework";

const markdown = `
- Go to "Account Settings"
- Click on Webhooks
- Copy this URL:
\`{{webhookUrl}}\`
- Paste it into the Trigger you want
- Should be good to go!
`


export const SessionData = createTrigger({
    auth: PieceAuth.None(),
    name: "session_data",
    displayName: "Session Data",
    description: "Triggers when a data is transferred",
    props: {
        md: Property.MarkDown({
            value: markdown
        })
    },
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
        //Empty
    },
    async onDisable(context){
        //Empty
    },
    async run(context) {
        const body = context.payload.body;
        return body;
    },
});