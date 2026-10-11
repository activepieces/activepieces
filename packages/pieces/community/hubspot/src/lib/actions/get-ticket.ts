import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { crmObjectOutputSchema } from '../output-schemas';

export const getTicketAction = createAction({
	auth: hubspotAuth,
	name: 'get-ticket',
	classification: 'READ',
	displayName: 'Get Ticket',
	description: 'Gets a ticket by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single support ticket by its HubSpot ticket ID, returning default and any requested additional properties. Use when you already have the ticket ID; use Find Ticket to look one up by another property first. Read-only and idempotent.', idempotent: true },
	outputSchema: crmObjectOutputSchema,
	props: {
		ticketId: Property.ShortText({
			displayName: 'Ticket ID',
			description: 'Map it from an earlier step like Find Ticket.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: subject, content, source_type, createdate, hs_pipeline, hs_pipeline_stage, hs_resolution, hs_ticket_category, hs_ticket_id, hs_ticket_priority, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TICKET,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const { ticketId,  } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const ticketDetails = await client.crm.tickets.basicApi.getById(ticketId, [
			...defaultTicketProperties,
			...additionalPropertiesToRetrieve,
		]);

		return ticketDetails;
	},
});
