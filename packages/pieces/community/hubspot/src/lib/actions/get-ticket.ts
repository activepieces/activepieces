import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { hubspotAuth } from '../../';

export const getTicketAction = createAction({
	auth: hubspotAuth,
	name: 'get-ticket',
	displayName: 'Get Ticket',
	description: 'Gets a ticket.',
	props: {
		ticketId: Property.ShortText({
			displayName: 'Ticket ID',
			description: 'The ID of the ticket to get.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
													
					subject, content, source_type, createdate, hs_pipeline, hs_pipeline_stage, hs_resolution, hs_ticket_category, hs_ticket_id, hs_ticket_priority, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id
																			
					**Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TICKET,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	async run(context) {
		const { ticketId,  } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);

		const client = new Client({ accessToken: context.auth.access_token });

		const ticketDetails = await client.crm.tickets.basicApi.getById(ticketId, [
			...defaultTicketProperties,
			...additionalPropertiesToRetrieve,
		]);

		return ticketDetails;
	},
});
