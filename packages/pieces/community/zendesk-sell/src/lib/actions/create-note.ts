import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';
import { contactIdDropdown, dealIdDropdown } from '../common/props';

export const createNote = createAction({
    auth: zendeskSellAuth,
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Create a new note.',
    props: {
        resource_type: Property.StaticDropdown({
            displayName: 'Resource Type',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'contact' },
                    { label: 'Deal', value: 'deal' },
                    { label: 'Lead', value: 'lead' },
                ]
            }
        }),
        resource_id: Property.Dropdown({
            displayName: 'Resource',
            required: true,
            refreshers: ['resource_type'],
            options: async ({ auth, resource_type }) => {
                if (!auth || !resource_type) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Select resource type first'
                    }
                }

                let url = 'https://api.getbase.com/v2/';
                switch (resource_type) {
                    case 'contact':
                        url += 'contacts';
                        break;
                    case 'deal':
                        url += 'deals';
                        break;
                    case 'lead':
                        url += 'leads';
                        break;
                    default:
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Invalid resource type'
                        }
                }

                const response = await httpClient.sendRequest<{
                    items: {
                        data: {
                            id: number;
                            name?: string; // Deals and contacts have name
                            last_name?: string; // Leads have last name
                        }
                    }[]
                }> ({
                    method: HttpMethod.GET,
                    url: url,
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: auth as string,
                    },
                });
        
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({
                        label: item.data.name || item.data.last_name || 'Untitled',
                        value: item.data.id
                    }))
                }
            }
        }),
        content: Property.LongText({
            displayName: 'Content',
            required: true,
        }),
    },
    async run(context) {
        const { resource_type, resource_id, content } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.getbase.com/v2/notes`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: {
                    resource_type: resource_type,
                    resource_id: resource_id,
                    content: content
                }
            }
        });

        return response.body;
    },
});
