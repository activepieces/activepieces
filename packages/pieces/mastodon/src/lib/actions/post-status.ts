import { AuthenticationType, createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";


export const postStatus = createAction({
    name: 'post_status',
    displayName: 'Post Status',
    description: 'Post a status to Mastodon',
    sampleData: {},
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            props: {
                base_url: Property.ShortText({
                    displayName: 'Base URL',
                    description: 'The base URL of your Mastodon instance',
                    defaultValue: "https://mastodon.social/",
                    required: true,
                }),
                access_token: Property.ShortText({
                    displayName: 'Access Token',
                    description: 'The access token for your Mastodon account, check the documentation for how to get this',
                    required: true
                })
            },
            required: true
        }),
        status: Property.LongText({
            displayName: 'Status',
            description: 'The text of your status',
            required: true,
        })
    },
    async run(context) {
        const token = context.propsValue.authentication.access_token;
        const status = context.propsValue.status;
        // Remove trailing slash from base_url
        const baseUrl = context.propsValue.authentication.base_url.replace(/\/$/, "");
        return await httpClient.sendRequest({
            url: `${baseUrl}/api/v1/statuses`,
            method: HttpMethod.POST,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token,
            },
            body: {
                status,
            }
        })
    },
});
