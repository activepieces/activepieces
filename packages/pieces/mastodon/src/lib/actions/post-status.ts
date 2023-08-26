import { Property, createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { mastodonAuth } from "../..";

export const postStatus = createAction({
    auth: mastodonAuth,
        name: 'post_status',
        displayName: 'Post Status',
        description: 'Post a status to Mastodon',
        props: {
            status: Property.LongText({
                displayName: 'Status',
                description: 'The text of your status',
                required: true,
            })
        },
        async run(context) {
            const token = context.auth.access_token;
            const status = context.propsValue.status;
            // Remove trailing slash from base_url
            const baseUrl = context.auth.base_url.replace(/\/$/, "");
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
