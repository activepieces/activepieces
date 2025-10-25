import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

export const createTask = createAction({
    auth: zendeskSellAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task.',
    props: {
        content: Property.LongText({
            displayName: 'Content',
            required: true,
        }),
        due_date: Property.DateTime({
            displayName: 'Due Date',
            required: false,
        }),
        resource_type: Property.StaticDropdown({
            displayName: 'Resource Type',
            required: false,
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
            required: false,
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
    },
    async run(context) {
        const { ...task } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.getbase.com/v2/tasks`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: task
            }
        });

        return response.body;
    },
});
