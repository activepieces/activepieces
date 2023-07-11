import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { freshdeskAuth } from "../..";

export const getTicketStatus = createAction({
    auth: freshdeskAuth,
    name: 'get_ticket_status',
    displayName: 'Get Ticket Status',
    description: 'Get Ticket status from Freshdesk.',

    props: {
        ticketid: Property.ShortText({
            displayName: 'Ticket ID',
            description: 'The Ticket ID to return status',
            required: true,
        }),
    },

    async run(context) {
        const FDapiToken = context.auth.access_token;
        const FDticketID = context.propsValue.ticketid;

        const headers = {
            'Authorization': FDapiToken,
            'Content-Type' : 'application/json',
        };


        // Remove trailing slash from base_url
        const baseUrl = context.auth.base_url.replace(/\/$/, "");
        const url = `${baseUrl}/api/v2/tickets/${FDticketID}`;
        const httprequestdata = {
            method: HttpMethod.GET,
            url,
            headers,
        };
        const response = await httpClient.sendRequest(httprequestdata);

        if (response.status == 200) {
            const status=response.body.status;
            switch (status) {
                case 2: { return 'OPEN'; break; }
                case 3: { return 'PENDING'; break; }
                case 4: { return 'RESOLVED'; break; }
                case 5: { return 'CLOSED'; break; }
                default: { return status; break; }
            }
          } else {
           return response.status;
          }
        
    }
})