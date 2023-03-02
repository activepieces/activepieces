import { createTrigger, TriggerStrategy } from "@activepieces/framework";
import { slackAuth, slackChannel } from "../common/props";


export const newMessage = createTrigger({
    name: 'new_message',
    displayName: 'New message',
    description: 'Trigger when a new message is received',
    props: {
        authentication: slackAuth,
        channel: slackChannel
    },
    type: TriggerStrategy.APP_WEBHOOK,
    onEnable: async (context) => {
        context.app.createListeners({ events: ['message'], identifierValue: context.propsValue.authentication.data.team_id })
    },
    onDisable: async (context) => {
        // Ignored
    },
    run: async (context) => {
        return [context.propsValue]
    },
    sampleData: {}
});
