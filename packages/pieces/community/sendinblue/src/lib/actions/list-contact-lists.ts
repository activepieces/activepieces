import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const listContactLists = createAction({
	auth: sendinblueAuth,
	name: 'list_contact_lists',
	classification: 'READ',
	displayName: 'List Contact Lists',
	description: 'List the contact lists on the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one page of Brevo contact lists with their ids, names, folder and subscriber counts. This is the way to turn a list name an agent was given into the numeric list id that Create Contact, Update Contact, Import Contacts and the campaign actions all require. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'How many lists to return, up to 50.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'How many lists to skip, for paging.',
			required: false,
			defaultValue: 0,
		}),
	},
	async run(context) {
		const { limit, offset } = context.propsValue;

		const response = await brevoCommon.apiCall<ListsResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/contacts/lists',
			query: { limit, offset },
		});

		const lists = response.lists ?? [];

		return { lists, count: response.count ?? lists.length };
	},
});

type ListsResponse = {
	lists?: unknown[];
	count?: number;
};
