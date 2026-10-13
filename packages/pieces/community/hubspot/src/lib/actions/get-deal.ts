import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { crmObjectOutputSchema } from '../output-schemas';

export const getDealAction = createAction({
	auth: hubspotAuth,
	name: 'get-deal',
	classification: 'READ',
	displayName: 'Get Deal',
	description: 'Gets a deal by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single deal by its HubSpot deal ID, returning default and any requested additional properties such as amount, stage, and close date. Use when you already have the deal ID. Read-only and idempotent.', idempotent: true },
	outputSchema: crmObjectOutputSchema,
	props: {
		dealId: Property.ShortText({
			displayName: 'Deal ID',
			description: 'Map it from an earlier step like Find Deal.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const { dealId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const dealDetails = await client.crm.deals.basicApi.getById(dealId, [
			...defaultDealProperties,
			...additionalPropertiesToRetrieve,
		]);
		return dealDetails;
	},
});
