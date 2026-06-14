import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const findUserAction = createAction({
	auth: intercomAuth,
	name: 'find-user',
	displayName: 'Find User',
	description: 'Finds an existing user.',
	audience: 'both',
	aiMetadata: { description: 'Look up a single existing user (signed-up contact) by email, Intercom ID, or external user ID. Read-only and repeatable; returns the first match plus a found flag and only matches role=user. To find a prospect instead, use Find Lead.', idempotent: true },
	props: {
		searchField: Property.StaticDropdown({
			displayName: 'Search Field',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'ID', value: 'id' },
					{ label: 'User ID', value: 'external_id' },
				],
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
		}),
	},
	async run(context) {
		const { searchField, searchValue } = context.propsValue;

		const client = intercomClient(context.auth);

		const contactResponse = await client.contacts.search({
			query: {
				operator: 'AND',
				value: [
					{
						field: searchField,
						operator: '=',
						value: searchValue,
					},
					{
						field: 'role',
						operator: '=',
						value: 'user',
					},
				],
			},
			pagination: { per_page: 1 },
		});

		return {
			found: contactResponse.data.length > 0,
			user: contactResponse.data.length > 0 ? contactResponse.data[0] : {},
		};
	},
});
