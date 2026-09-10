import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const listContacts = createAction({
	auth: sendinblueAuth,
	name: 'list_contacts',
	classification: 'READ',
	displayName: 'List Contacts',
	description: 'List contacts, one page at a time.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one page of Brevo contacts with their attributes and blacklist flags, optionally narrowed to a single list or to contacts modified since a given date. Use this to browse or export the audience; to fetch one known contact use Get Contact instead, which is far cheaper. Returns at most Limit contacts per call — page through larger audiences by raising Offset. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'How many contacts to return, up to 1000.',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'How many contacts to skip, for paging.',
			required: false,
			defaultValue: 0,
		}),
		modified_since: Property.DateTime({
			displayName: 'Modified Since',
			description: 'Only return contacts changed after this moment.',
			required: false,
		}),
		list_id: Property.Number({
			displayName: 'List ID',
			description: 'Only return contacts belonging to this list.',
			required: false,
		}),
	},
	async run(context) {
		const { limit, offset, modified_since, list_id } = context.propsValue;

		const resourceUri = list_id
			? `/contacts/lists/${list_id}/contacts`
			: '/contacts';

		const response = await brevoCommon.apiCall<ListContactsResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri,
			query: {
				limit,
				offset,
				modifiedSince: modified_since,
			},
		});

		const contacts = response.contacts ?? [];

		return { contacts, count: response.count ?? contacts.length };
	},
});

type ListContactsResponse = {
	contacts?: unknown[];
	count?: number;
};
