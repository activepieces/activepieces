import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listObjectPropertiesOutputSchema } from '../output-schemas';

export const listObjectPropertiesAction = createAction({
	auth: hubspotAuth,
	name: 'list_object_properties',
	classification: 'SEARCH',
	displayName: 'List Object Properties',
	description: 'Lists the properties defined on a CRM object type.',
	audience: 'ai',
	outputSchema: listObjectPropertiesOutputSchema,
	aiMetadata: {
		description:
			'Lists the properties defined on a CRM object type, returning each internal name with its label, type and, for enumerations, its allowed options. Use it to discover custom property names before writing them, since a write needs the internal name rather than the label shown in the UI. Standard names such as email or firstname are already well known, so this matters most for custom fields; the contact object alone has hundreds of properties, so use Custom Only to cut the noise. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		objectType: Property.ShortText({
			displayName: 'Object Type',
			description: 'The object type, such as contacts, companies, deals, tickets, notes or tasks.',
			required: true,
		}),
		customOnly: Property.Checkbox({
			displayName: 'Custom Only',
			description: 'Return only properties defined by this account, hiding HubSpot built-ins.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { objectType, customOnly } = context.propsValue;

		const response = await httpClient.sendRequest<{
			results: Array<Record<string, unknown>>;
		}>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/crm/v3/properties/${objectType}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const all = response.body.results ?? [];
		const properties = customOnly === true ? all.filter((property) => property['hubspotDefined'] !== true) : all;

		return { properties, count: properties.length };
	},
});
