import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getTicketStatus = createAction({
    name: 'get_ticket_status',
    displayName: 'Get Ticket Status',
    description: 'Get Ticket status from Freshdesk.',

    props: {
        ticketid: Property.ShortText({
            displayName: 'Ticket ID',
            description: 'The Ticket ID to return status',
            required: true,
        }),
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
        const FDticketID = context.propsValue.ticketid;

        const headers = {
            'Authorization': FDapiToken,
            'Content-Type' : 'application/json',
        };


        // Remove trailing slash from base_url
        const baseUrl = context.propsValue.authentication.base_url.replace(/\/$/, "");
        const url = `${baseUrl}/api/v2/tickets/${FDticketID}`;
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