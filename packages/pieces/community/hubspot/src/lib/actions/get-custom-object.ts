import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';
import { crmObjectOutputSchema } from '../output-schemas';

export const getCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'get-custom-object',
	classification: 'READ',
	displayName: 'Get Custom Object',
	description: 'Gets a custom object record by its ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetches a single custom-object record by its ID for a chosen custom object type, returning the requested properties. Use when you already have the record ID and the custom object type; for standard CRM objects use the dedicated Get Contact / Deal / Company / Ticket actions instead. Read-only and idempotent.', idempotent: true },
	outputSchema: crmObjectOutputSchema,
	props: {
		customObjectType: customObjectDropdown,
		customObjectId: Property.ShortText({
			displayName: 'Custom Object ID',
			description: 'Map it from an earlier step like Find Custom Object.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: hs_object_id, hs_lastmodifieddate, hs_createdate.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown({
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const customObjectType = context.propsValue.customObjectType as string;
		const customObjectId = context.propsValue.customObjectId as string;
		const additionalPropertiesToRetrieve =
			context.propsValue.additionalPropertiesToRetrieve?.['values'];

		let propertiesToRetrieve;
		try {
			if (Array.isArray(additionalPropertiesToRetrieve)) {
				propertiesToRetrieve = additionalPropertiesToRetrieve;
			}
			if (typeof additionalPropertiesToRetrieve === 'string') {
				propertiesToRetrieve = JSON.parse(additionalPropertiesToRetrieve as string);
			}
		} catch (error) {
			propertiesToRetrieve = [];
		}

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const customObjectDetails = await client.crm.objects.basicApi.getById(
			customObjectType,
			customObjectId,
			propertiesToRetrieve,
		);

		return customObjectDetails;
	},
});
