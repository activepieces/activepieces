import {
    createAction,
    PiecePropValueSchema,
    Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { bitlyAuth } from '../../index';


export const createBitlink = createAction({
    auth: bitlyAuth,
    name: 'create_bitlink',
    displayName: 'Create Bitlink',
    description: 'Create a full Bitlink.',
    props: {
        long_url: Property.LongText({
            description: 'The long URL to shorten.',
            displayName: 'Long URL',
            required: true
        }),
        domain: Property.ShortText({
            description: 'The domain of the Bitlink.',
            displayName: 'Domain',
            defaultValue: 'bit.ly',
            required: true
        }),
        group: Property.Dropdown({
            description: 'The group of the Bitlink.',
            displayName: 'Group',
            required: true,
            options: async ({ auth }) => {
                const connection = auth as PiecePropValueSchema<typeof bitlyAuth>

                if (!connection) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first'
                    }
                }
                const result: { guid: string, name: string }[] = [];
                
                const request: HttpRequest = {
                    method: HttpMethod.GET,
                    url: "https://api-ssl.bitly.com/v4/groups",
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: connection
                    },
                };
                
                const response = await httpClient.sendRequest<{ groups: { guid: string, name: string }[] }>(request);
                
                result.push(...response.body.groups);

            
                const options = result.map(group => {
                    return { value: group.guid, label: group.name }
                });
                
                return {
                    options: options,
                    disabled: false,
                }

                
                

            },
            refreshers: [],
        }),
        title: Property.ShortText({
            description: 'The title of the Bitlink.',
            displayName: 'Title',
            required: false
        }),
        tags: Property.Array({
            description: 'The tags of the Bitlink. (Strings)',
            displayName: 'Tags',
            required: false,
        }),
        deeplinks: Property.Array({
            description: 'The deeplinks of the Bitlink. (Json Objects. Details on: https://dev.bitly.com/api-reference/#createFullBitlink) Example: { "app_id": "com.bitly.app", "app_uri_path": "/store?id=123456", "install_url": "https://play.google.com/store/apps/details?id=com.bitly.app&hl=en_US", "install_type": "promote_install" } ',
            displayName: 'Deeplinks',
            required: false,
        }),
    },
    async run(context) {

        const requestBody: Record<string, unknown> = {};
        if (context.propsValue.title) {
            requestBody['date'] = context.propsValue.title;
        }
        if (context.propsValue.tags) {
            requestBody['tags'] = context.propsValue.tags;
        }

        if (context.propsValue.deeplinks) {
            // convert deeplinks list to json objects
            const stringJsonList: string[] = context.propsValue.deeplinks as string[];
            const jsonObjects = stringJsonList.map(str => JSON.parse(str));
            const combinedJsonObject = jsonObjects.reduce((acc, obj) => {
                return { ...acc, ...obj };
            }, {});

            requestBody['deeplinks'] = [combinedJsonObject];

        }
        
        requestBody['long_url'] = context.propsValue.long_url;
        requestBody['domain'] = context.propsValue.domain;

        return await httpClient.sendRequest<{ link: string }>({
            method: HttpMethod.POST,
            url: `https://api-ssl.bitly.com/v4/bitlinks`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string
            },
            body: requestBody
        })
    }
})