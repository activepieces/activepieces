import { createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";

export const sendMessage = createAction({
    name: "send_message",
    displayName: "Send Message",
    description: "Send a message to a Mattermost channel",
    props: {
        webhook_url: Property.ShortText({
            displayName: "Incoming Webhook URL",
            description: "The webhook URL for the Mattermost channel",
            required: true,
        }),
        text: Property.LongText({
            displayName: "Message Text",
            description: "The text of the message to send",
            required: true,
        }),
        username: Property.ShortText({
            displayName: "Username",
            description: "The username to use when sending the message, check the documentation to see how allow username to be overridden",
            required: false,
        }),
        channel: Property.ShortText({
            displayName: "Channel",
            description: "The channel to send the message to, make sure the webhook is configured to allow channel to be overridden",
            required: false,
        }),
        icon_url: Property.ShortText({
            displayName: "Icon URL",
            description: "The URL of the icon to use when sending the message, check the documentation to see how allow icon to be overridden",
            required: false,
        }),

    },
    sampleData: {},
    async run(context) {
        return await httpClient.sendRequest({
            url: `${context.propsValue.webhook_url}`,
            method: HttpMethod.POST,
            body: {
                text: context.propsValue.text,
                username: context.propsValue.username,
                icon_url: context.propsValue.icon_url,
                channel: context.propsValue.channel,
            },
        })
    }
})