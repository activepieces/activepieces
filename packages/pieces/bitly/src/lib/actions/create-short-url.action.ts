import {
    createAction,
    PiecePropValueSchema,
    Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { bitlyAuth } from '../../index';

export const createShortUrl = createAction({
    auth: bitlyAuth,
    name: 'create_short_url',
    displayName: 'Create Short URL',
    description: 'Create a short URL with Bitly.',
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
    },
    async run(context) {
        return await httpClient.sendRequest<{ link: string }>({
            method: HttpMethod.POST,
            url: `https://api-ssl.bitly.com/v4/shorten`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string
            },
            body: {
                long_url: context.propsValue.long_url,
                domain: context.propsValue.domain,
                group_guid: context.propsValue.group,
            }
        })
    }
})
