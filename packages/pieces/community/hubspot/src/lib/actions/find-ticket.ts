import { MarkdownVariant } from '@activepieces/pieces-framework';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';
import { ticketSearchOutputSchema } from '../output-schemas';

export const findTicketAction = createAction({
	auth: hubspotAuth,
	name: 'find-ticket',
	classification: 'SEARCH',
	displayName: 'Find Ticket',
	description: 'Finds up to 200 tickets matching one or two property values.',
	audience: 'both',
	aiMetadata: { description: 'Searches support tickets via the HubSpot CRM search API, matching on one or two property name/value pairs (exact match, combined as AND), and returns matching tickets. Use to locate a ticket by subject or another property before reading or updating it; prefer Get Ticket when you already have the ticket ID. Read-only and idempotent.', idempotent: true },
	outputSchema: ticketSearchOutputSchema,
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'Search Property',
				description: 'The property to compare, such as the subject.',
				required: true,
			},
			true,
			true,
		),
		firstSearchPropertyValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'Only exact matches are returned.',
			required: true,
		}),
		secondSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'Second Search Property',
				description: 'Optional second condition; records must match both.',
				required: false,
				advanced: true,
			},
			true,
			true,
		),
		secondSearchPropertyValue: Property.ShortText({
			displayName: 'Second Search Value',
			description: 'Ignored unless a second property is also chosen.',
			required: false,
			advanced: true,
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
		const {
			firstSearchPropertyName,
			firstSearchPropertyValue,
			secondSearchPropertyName,
			secondSearchPropertyValue,
		} = context.propsValue;

		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const filters = [
			{
				propertyName: firstSearchPropertyName as string,
				operator: FilterOperatorEnum.Eq,
				value: firstSearchPropertyValue,
			},
		];

		if (secondSearchPropertyName && secondSearchPropertyValue) {
			filters.push({
				propertyName: secondSearchPropertyName as string,
				operator: FilterOperatorEnum.Eq,
				value: secondSearchPropertyValue,
			});
		}

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);

		const response = client.crm.tickets.searchApi.doSearch({
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: [...defaultTicketProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});

		return response;
	},
});
