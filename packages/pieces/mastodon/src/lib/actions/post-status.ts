import { AuthenticationType, createAction, httpClient, HttpMethod, Property } from "../../../../framework/src";


export const postStatus = createAction({
    name: 'post_status',
    displayName: 'Post Status',
    description: 'Post a status to Mastodon',
    sampleData: {},
    props: {
        base_url: Property.ShortText({
            displayName: 'Base URL',
            description: 'The base URL of your Mastodon instance',
            required: true,
        }),
        authentication: Property.ShortText({
            displayName: 'Access Token',
            description: 'The access token for your Mastodon account, check the documentation for how to get this',
            required: true,
        }),
        status: Property.LongText({
            displayName: 'Status',
            description: 'The text of your status',
            required: true,
        })
    },
    async run(context) {
        const token = context.propsValue.authentication;
        const status = context.propsValue.status;
        // Remove trailing slash from base_url
        const baseUrl = context.propsValue.base_url.replace(/\/$/, "");
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
