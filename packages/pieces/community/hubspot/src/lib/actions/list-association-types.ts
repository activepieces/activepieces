import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listAssociationTypesOutputSchema } from '../output-schemas';

export const listAssociationTypesAction = createAction({
	auth: hubspotAuth,
	name: 'list_association_types',
	classification: 'READ',
	displayName: 'List Association Types',
	description: 'Lists the association types available between two object types.',
	audience: 'ai',
	outputSchema: listAssociationTypesOutputSchema,
	aiMetadata: {
		description:
			'Lists the ways two CRM object types can be linked, returning each numeric typeId with its label and its category of HUBSPOT_DEFINED or USER_DEFINED. Use it before Create Associations or Remove Associations, which need the type id: a label such as "Billing Contact" corresponds to a number that cannot be guessed. Both the typeId and the category are needed to write an association. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		fromObjectType: Property.ShortText({
			displayName: 'From Object Type',
			description: 'The object type the association starts at, such as contact, company, deal or ticket.',
			required: true,
		}),
		toObjectType: Property.ShortText({
			displayName: 'To Object Type',
			description: 'The object type the association points at, such as company or deal.',
			required: true,
		}),
	},
	async run(context) {
		const { fromObjectType, toObjectType } = context.propsValue;

		const response = await httpClient.sendRequest<{
			results: Array<Record<string, unknown>>;
		}>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const associationTypes = response.body.results ?? [];
		return { associationTypes, count: associationTypes.length };
	},
});
