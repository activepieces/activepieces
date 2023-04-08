import { createAction, Property } from "@activepieces/framework";
import { AuthenticationType, httpClient, HttpError, HttpMethod } from "@activepieces/pieces-common";

const markdownDescription = `
**Workspace URL**: The url of mattermost instance (e.g \`https://activepieces.mattermost.com\`)

**Bot Token**: Obtain it from settings > integrations > bot accounts > add bot account
`;

export const sendMessage = createAction({
    name: "send_message",
    displayName: "Send Message",
    description: "Send a message to a Mattermost channel",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: markdownDescription,
            required: true,
            props: {
                workspace_url: Property.ShortText({
                    displayName: "Workspace URL",
                    description: "The workspace URL of the Mattermost instance (e.g https://activepieces.mattermost.com)",
                    required: true,
                }),
                token: Property.ShortText({
                    displayName: "Bot Token",
                    description: "The bot token to use to authenticate",
                    required: true,
                })
            }
        }),
        channel_id: Property.ShortText({
            displayName: "Channel ID",
            description: "The channel to send the message to, get that ID by clicking on info near start call butto",
            required: true,
        }),
        text: Property.LongText({
            displayName: "Message Text",
            description: "The text of the message to send",
            required: true,
        })

    },
    sampleData: {},
    async run(context) {
        // Remove trailling slash from workspace URL
        const baseUrl = context.propsValue.authentication.workspace_url.replace(/\/$/, "");
        try {
            return await httpClient.sendRequest({
                url: `${baseUrl}/api/v4/posts`,
                method: HttpMethod.POST,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: context.propsValue.authentication.token,
                },
                body: {
                    channel_id: context.propsValue.channel_id,
                    message: context.propsValue.text,
                },
            })
        } catch (e: HttpError | unknown) {
            if (e instanceof HttpError) {
                const httpError = e as HttpError;
                console.log(httpError);
                if (httpError?.response.status === 403) {
                    throw new Error("Please make sure you have the correct bot token and channel ID.");
                }
            }
            throw e;
        }
    }
})