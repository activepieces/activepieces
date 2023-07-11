import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { freshdeskAuth } from "../..";
import { isNull } from "lodash";

export const getTicketStatus = createAction({
    auth: freshdeskAuth,
    name: 'get_ticket_status',
    displayName: 'Get Ticket Status',
    description: 'Get Ticket status from Freshdesk. Returns ticket_status, assigned_status, assigned_id',

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
            const responderid=response.body.responder_id;
            let ass='';
            let tstatus='';

            if (isNull(responderid)) {
                ass="NOTASSIGNED";
            } else {
                 ass="ASSIGNED";
            }
             
            switch (status) {
                case 2: { tstatus=('OPEN'); break; }
                case 3: { tstatus=('PENDING'); break; }
                case 4: { tstatus=('RESOLVED'); break; }
                case 5: { tstatus=('CLOSED'); break; }
                default: { tstatus=status; break; }
            }
            const json=[{
                ticket_status: tstatus,
                assigned_status: ass,
                assigned_id: responderid
                }]
                return json;
          } else {
           return response.status;
          }               
    }
})