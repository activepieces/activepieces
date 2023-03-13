import { createTrigger, Property } from "@activepieces/framework";
import { TriggerStrategy } from "@activepieces/shared";
import { slackAuth } from "../common/props";


export const newReactionAdded = createTrigger({
    name: 'new_reaction_added',
    displayName: 'New Reaction (Beta)',
    description: 'Trigger when a new reaction is added to a message',
    props: {
        authentication: slackAuth,
        emoj: Property.Array({
            displayName: 'Emojis (E.g fire, smile)',
            description: 'Select emojs to trigger on',
            required: false,
        }),
    },
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: {
        "client_msg_id": "2767cf34-0651-44e0-b9c8-1b167ce9b7a9",
        "type": "message",
        "text": "f",
        "user": "U037UG6FKPU",
        "ts": "1678231735.586539",
        "blocks": [
            {
                "type": "rich_text",
                "block_id": "4CM",
                "elements": [
                    {
                        "type": "rich_text_section",
                        "elements": [
                            {
                                "type": "text",
                                "text": "f"
                            }
                        ]
                    }
                ]
            }
        ],
        "team": "T037MS4FGDC",
        "channel": "C037RTX2ZDM",
        "event_ts": "1678231735.586539",
        "channel_type": "channel"
    },
    onEnable: async (context) => {
        context.app.createListeners({ events: ['reaction_added'], identifierValue: context.propsValue.authentication.data['team_id'] })
    },
    onDisable: async (context) => {
        // Ignored
    },
    run: async (context) => {
        if (context.propsValue.emoj) {
            if (context.propsValue.emoj.includes(context.payload.body.reaction)) {
                return [];
            }
        }
        return [context.payload.body.event]
    }
});
