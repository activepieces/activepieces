import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { additionalPropertyNamesDropdown, getDefaultProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getTicketAction = createAction({
    auth: hubspotAuth,
    name: 'get-ticket',
    displayName: 'Get Ticket',
    description: 'Gets a ticket.',
    props: {
        ticketId : Property.ShortText({
            displayName: 'Ticket ID',
            description: 'The ID of the ticket to get.',
            required: true,
        }),
        additionalProperties:additionalPropertyNamesDropdown(OBJECT_TYPE.TICKET)

    },
    async run(context) {
        const ticketId = context.propsValue.ticketId;
        const additionalProperties = context.propsValue.additionalProperties ?? [];

        const defaultProperties = getDefaultProperties(OBJECT_TYPE.TICKET)

        // https://developers.hubspot.com/docs/reference/api/crm/objects/tickets#get-%2Fcrm%2Fv3%2Fobjects%2Ftickets%2F%7Bticketid%7D
        const ticketResponse = await hubspotApiCall({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            resourceUri:`/crm/v3/objects/tickets/${ticketId}`,
            query:{
                properties: [...defaultProperties, ...additionalProperties].join(',')
            }
        })

        return ticketResponse;
    },
});
