import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const sendNotification = createAction({
    name: "send_notification",
    displayName: "Send Notification",
    description: "Send a notification to Pushover",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: `
            To obtain the api token:
            
            1. Log in to Pushover.
            2. Click on your Application or on Create an Application/API Token
            3. Copy the API Token/Key.

            To obtain the user key:
            1. Log in to Pushover
            2. Copy your Your User Key

            Note if you want to send the message to your group, you should specify a group key instead of the user key
            `,
            props: {
                api_token: Property.SecretText({
                    displayName: "Api Token",
                    description: "Pushover Api Token",
                    required: true,
                }),
                user_key: Property.SecretText({
                    displayName: "User Key",
                    description: "Pushover User Key",
                    required: true,
                }),
            },
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
        priority: Property.Number({
            displayName: "Priority",
            description: "The priority of the notification (-2 to 2). -2 is lowest priority. If set to 2, you should also specify Retry and Expire.",
            required: false,
        }),
        retry: Property.Number({
            displayName: "Retry",
            description: "Works only if priority is set to 2. Specifies how often (in seconds) the Pushover servers will send the same notification to the user.",
            required: false,
        }),
        expire: Property.Number({
            displayName: "Expire",
            description: "Works only if priority is set to 2. Specifies how many seconds your notification will continue to be retried for (every retry seconds).",
            required: false,
        }),
        url: Property.ShortText({
            displayName: "URL",
            description: "A supplementary URL to show with your message.",
            required: false,
        }),
        url_title: Property.ShortText({
            displayName: "URL Title",
            description: "A title for the URL specified as the url input parameter, otherwise just the URL is shown.",
            required: false,
        }),
        timestamp: Property.ShortText({
            displayName: "Timestamp",
            description: "a Unix timestamp of a time to display instead of when our API received it.",
            required: false,
        }),
        device: Property.ShortText({
            displayName: "Device",
            description: "The name of one of your devices to send just to that device instead of all devices.",
            required: false,
        }),
    },
    async run({ propsValue }) {
        const baseUrl = 'https://api.pushover.net/1/messages.json';
        const apiToken = propsValue.authentication.api_token;
        const userKey = propsValue.authentication.user_key;

        const title = propsValue.title;
        const message = propsValue.message;
        const priority = propsValue.priority;
        const url = propsValue.url;
        const url_title = propsValue.url_title;
        const timestamp = propsValue.timestamp;
        const device = propsValue.device;
        const retry = propsValue.retry;
        const expire = propsValue.expire;

        return await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: baseUrl,
            body: {
                token: apiToken,
                user: userKey,
                title,
                message,
                url,
                url_title,
                timestamp,
                device,
                ...(priority) && { priority: +priority },
                ...(retry) && { retry: +retry },
                ...(expire) && { expire: +expire },
            }
        });
    }
})