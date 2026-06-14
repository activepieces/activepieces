import { MarkdownVariant } from '@activepieces/shared';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';

export const findTicketAction = createAction({
	auth: hubspotAuth,
	name: 'find-ticket',
	displayName: 'Find Ticket',
	description: 'Finds a ticket by searching.',
	audience: 'both',
	aiMetadata: { description: 'Searches support tickets via the HubSpot CRM search API, matching on one or two property name/value pairs (exact match, combined as AND), and returns matching tickets. Use to locate a ticket by subject or another property before reading or updating it; prefer Get Ticket when you already have the ticket ID. Read-only and idempotent.', idempotent: true },
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'First search property name',
				required: true,
			},
			true,
			true,
		),
		firstSearchPropertyValue: Property.ShortText({
			displayName: 'First search property value',
			required: true,
		}),
		secondSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'Second search property name',
				required: false,
			},
			true,
			true,
		),
		secondSearchPropertyValue: Property.ShortText({
			displayName: 'Second search property value',
			required: false,
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

		const client = new Client({ accessToken: context.auth.access_token });

		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);

		const response = client.crm.tickets.searchApi.doSearch({
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: [...defaultTicketProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});

		return response;
	},
});
