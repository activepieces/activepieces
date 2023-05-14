import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const sendNotification = createAction({
    name: "send_notification",
    displayName: "Send Notification",
    description: "Send a notification to gotify",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: `
            To obtain a token:
            
            1. Log in to your Gotify instance.
            2. Click on Apps
            3. Select the Eye icon in the same row as your App to copy your token, or CREATE APPLICATION if you do not have one app yet.
            4. Copy your access token & and paste them into the fields below.
            `,
            props: {
                base_url: Property.ShortText({
                    displayName: "Server URL",
                    description: "Gotify Instance URL",
                    required: true,
                }),
                app_token: Property.SecretText({
                    displayName: "App Token",
                    description: "Gotify App Token",
                    required: true,
                })
            },
            required: true,
        }),
        title: Property.ShortText({
            displayName: "Title",
            description: "The title of the notification",
            required: true,
        }),
        message: Property.LongText({
            displayName: "Message",
            description: "The message to send",
            required: true,
        }),
        priority: Property.Number({
            displayName: "Priority",
            description: "The priority of the notification (0-10). 0 is lowest priority.",
            required: false,
        }),
    },
    async run({ propsValue }) {
        const baseUrl = propsValue.authentication.base_url.replace(/\/$/, "");
        const appToken = propsValue.authentication.app_token;

        const title = propsValue.title;
        const message = propsValue.message;
        const priority = propsValue.priority;

        return await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/message?token=${appToken}`,
            body: {
                title,
                message,
                ...(priority) && { priority: +priority }
            }
        });
    }
})