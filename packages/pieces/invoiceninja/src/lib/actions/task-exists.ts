import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { invoiceninjaAuth } from "../..";

export const existsTask = createAction({
    auth: invoiceninjaAuth,
        name: 'exists_task',
        displayName: 'Does Task Exist?',
        description: 'Checks to see if a task already exists.',

        props: {
            number: Property.LongText({
                displayName: 'Task or Ticket Number (alphanumeric)',
                description: 'A task or ticket number to check',
                required: true,
            }),
        },

        async run(context) {
            const INapiToken = context.auth.access_token;

            const headers = {
                'X-Api-Token': INapiToken,
            };

            const queryParams = new URLSearchParams();
            queryParams.append('number', context.propsValue.number || '');

            // Remove trailing slash from base_url
            const baseUrl = context.auth.base_url.replace(/\/$/, "");
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
