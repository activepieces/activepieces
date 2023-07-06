import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getTickets = createAction({
    name: 'get_tickets',
    displayName: 'Get Tickets',
    description: 'Get Ticket instances from Freshdesk.',

    props: {
        authentication: Property.CustomAuth({
            displayName: 'Freshdesk Custom Authentication',
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
    },

    async run(context) {
        const FDapiToken = context.propsValue.authentication.access_token;

        const headers = {
            'Authorization': FDapiToken,
            'Content-Type' : 'application/json',
        };

       // const queryParams = new URLSearchParams();
        //queryParams.append('number', context.propsValue.number || '');
        //queryParams.append('client_id', context.propsValue.client_id || '');
       // queryParams.append('project_id', context.propsValue.project_id || '');
       // queryParams.append('description', context.propsValue.description || '');
       // queryParams.append('rate', context.propsValue.rate?.toString() || '');

        // Remove trailing slash from base_url
        const baseUrl = context.propsValue.authentication.base_url.replace(/\/$/, "");
        // not needed for gettickets ?${queryParams.toString()}
        const url = `${baseUrl}/api/v2/tickets/`;
        const httprequestdata = {
            method: HttpMethod.GET,
            url,
            headers,
        };
        const response = await httpClient.sendRequest(httprequestdata);

        if (response.status == 200) {
            return response.body;
          } else {
            return response;
          }
        
    }
})