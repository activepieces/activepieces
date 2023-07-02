import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createTask = createAction({
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Creates a task instance in Invoice Ninja for billing purposes.',

    props: {
        authentication: Property.CustomAuth({
            displayName: 'Custom Authentication',
            props: {
                base_url: Property.ShortText({
                    displayName: 'Base URL',
                    description: 'Enter the base URL',
                    required: true,
                }),
                access_token: Property.LongText({
                    displayName: 'API Token',
                    description: 'Enter the API token',
                    required: true,
                })
            },
            required: true
        }),
        number: Property.LongText({
            displayName: 'Task or Ticket Number (alphanumeric)',
            description: 'A unique task or ticket number that has not been used before in Invoice Ninja',
            required: true,
        }),
        client_id: Property.LongText({
            displayName: 'Client ID (alphanumeric)',
            description: 'Client ID from Invoice Ninja (optional)',
            required: false,
        }),
        project_id: Property.LongText({
            displayName: 'Project ID (alphanumeric)',
            description: 'Project ID from Invoice Ninja (optional)',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description of task',
            description: 'Description of task to be billed',
            required: true,
        }),
        rate: Property.Number({
            displayName: 'Custom hourly rate',
            description: 'Custom hourly rate (optional) otherwise default used',
            required: false,
        })
    },

    async run(context) {
        const INapiToken = context.propsValue.authentication.access_token;

        const headers = {
            'X-Api-Token': INapiToken,
        };

        const queryParams = new URLSearchParams();
        queryParams.append('number', context.propsValue.number || '');
        queryParams.append('client_id', context.propsValue.client_id || '');
        queryParams.append('project_id', context.propsValue.project_id || '');
        queryParams.append('description', context.propsValue.description || '');
        queryParams.append('rate', context.propsValue.rate?.toString() || '');

        // Remove trailing slash from base_url
        const baseUrl = context.propsValue.authentication.base_url.replace(/\/$/, "");
        const url = `${baseUrl}/api/v1/tasks?${queryParams.toString()}`;
        const httprequestdata = {
            method: HttpMethod.POST,
            url,
            headers,
        };
        const response = await httpClient.sendRequest(httprequestdata);
        return response.body;
    }
})