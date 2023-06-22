import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { slackChannel } from "../common/props";
import { slackAuth } from "../../";

export const slackNewMessageTrigger = createTrigger({
    auth: slackAuth,
    trigger: {
        name: 'new_message',
        displayName: 'New Message',
        description: 'Triggers when a new message is received',
        props: {
            channel: slackChannel
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
            context.app.createListeners({ events: ['message'], identifierValue: context.auth.data['team_id'] })
        },
        onDisable: async (context) => {
            // Ignored
        },
        run: async (context) => {
            if (context.payload.body.event.channel === context.propsValue.channel) {
                return [context.payload.body.event]
            }
            return [];
        }
    }
});
