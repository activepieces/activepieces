import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const sendNotification = createAction({
    name: "send_notification",
    displayName: "Send Notification",
    description: "Send a notification to ntfy",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: `
            To obtain a token:
            
            1. Log in to your Ntfy instance.
            2. Click on Account
            3. Go under, on Access tokens and click on the button icon to copy your Token or CREATE ACCESS TOKEN if you do not have
            4. Please pay attention to the expiration time when copying/creating a Token.
            4. Copy your access token & and paste them into the fields below.
            `,
            props: {
                base_url: Property.ShortText({
                    displayName: "Server URL",
                    description: "Ntfy Instance URL",
                    required: true,
                }),
                access_token: Property.SecretText({
                    displayName: "Access Token",
                    description: "Ntfy Access Token",
                    required: false,
                })
            },
            required: true,
        }),
        topic: Property.ShortText({
            displayName: "Topic",
            description: "The topic/channel to send the notification to, e.g. test1",
            required: true,
        }),
        title: Property.ShortText({
            displayName: "Title",
            description: "The title of the notification",
            required: false,
        }),
        message: Property.LongText({
            displayName: "Message",
            description: "The message to send",
            required: true,
        }),
        priority: Property.ShortText({
            displayName: "Priority",
            description: "The priority of the notification (1-5). 1 is lowest priority.",
            required: false,
        }),
        tags: Property.Array({
            displayName: "Tags",
            description: "The tags for the notification.",
            required: false,
        }),
        icon: Property.ShortText({
            displayName: "Icon",
            description: "The absolute URL to your icon, e.g. https://example.com/communityIcon_xnt6chtnr2j21.png",
            required: false,
        }),
        actions: Property.LongText({
            displayName: "Actions",
            description: "Add Action buttons to notifications, see https://docs.ntfy.sh/publish/#action-buttons",
            required: false,
        }),
        click: Property.ShortText({
            displayName: "Click",
            description: "You can define which URL to open when a notification is clicked, see https://docs.ntfy.sh/publish/#click-action",
            required: false,
        }),
        delay: Property.ShortText({
            displayName: "Delay",
            description: "Let ntfy send messages at a later date, e.g. 'tomorrow, 10am', see https://docs.ntfy.sh/publish/#scheduled-delivery",
            required: false,
        }),
    },
    async run({ propsValue }) {
        const baseUrl = propsValue.authentication.base_url.replace(/\/$/, "");
        const accessToken = propsValue.authentication.access_token;

        const topic = propsValue.topic;
        const title = propsValue.title;
        const message = propsValue.message;
        const priority = propsValue.priority;
        const tags = propsValue.tags;
        const icon = propsValue.icon;
        const actions = propsValue.actions;
        const click = propsValue.click;
        const delay = propsValue.delay;

        return await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/${topic}`,
            ...(accessToken) && {
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: accessToken,
                }
            },
            headers: {
                'X-Message': message,
                'X-Title': title,
                'X-Priority': priority,
                'X-Tags': tags?.join(','),
                'X-Icon': icon,
                'X-Actions': actions,
                'X-Click': click,
                'X-Delay': delay,
            },
        });
    }
})