import { Property, createAction} from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";


const markdownDescription = `
**Base Url**: The base url of your Mastodon instance (e.g \`https://mastodon.social\`)

**Access Token**: To get your access token, follow the steps below:

1. Go to your **Profile** -> **Preferences** -> **Development** -> **New Application**
2. Fill the Information
3. Click on **Create Application**
4. Copy access token from **Your access token**
`;

export const postStatus = createAction({
    name: 'post_status',
    displayName: 'Post Status',
    description: 'Post a status to Mastodon',
    sampleData: {},
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            description: markdownDescription,
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
