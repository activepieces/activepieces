import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listContactListsActionOutputSchema } from '../output-schemas';

export const listContactLists = createAction({
	auth: sendinblueAuth,
	name: 'list_contact_lists',
	outputSchema: listContactListsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Contact Lists',
	description: 'List the contact lists in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo contact lists with their id, name, folder id and subscriber counts. This is the way to resolve a list name to the numeric list id that other actions such as Create Contact List, Get Contact List or contact management actions require. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of lists to return per page. Maximum 50. Defaults to 10.',
			required: false,
			defaultValue: 10,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Index of the first list to return. Defaults to 0.',
			required: false,
			defaultValue: 0,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order for the results, based on the list creation date.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
	},
	async run(context) {
		const { limit, offset, sort } = context.propsValue;

		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/contacts/lists',
			query: {
				limit,
				offset,
				sort,
			},
		});

		return response;
	},
});
