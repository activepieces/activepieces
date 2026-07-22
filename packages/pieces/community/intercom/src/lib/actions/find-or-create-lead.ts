import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const findOrCreateLeadAction = createAction({
	auth: intercomAuth,
	name: 'find-or-create-lead',
	displayName: 'Find or Create Lead',
	description: 'Finds a lead by email, ID, or User ID, creating it if none is found.',
	audience: 'both',
	aiMetadata: {
		description:
			'Resolve a lead (role=lead prospect) to a single record: searches by email, Intercom ID, or external User ID and returns the match, or creates a new lead when none exists. Returns the lead plus a "created" flag. For signed-up users use Find User / Create User instead.',
		idempotent: true,
	},
	props: {
		searchField: Property.StaticDropdown({
			displayName: 'Search Field',
			required: true,
			defaultValue: 'email',
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
		name: Property.ShortText({
			displayName: 'Full Name',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			required: false,
		}),
	},
	async run(context) {
		const { searchField, searchValue, name, phone, customAttributes } = context.propsValue;

		const client = intercomClient(context.auth);

		const existing = await client.contacts.search({
			query: {
				operator: 'AND',
				value: [
					{ field: searchField, operator: '=', value: searchValue },
					{ field: 'role', operator: '=', value: 'lead' },
				],
			},
			pagination: { per_page: 1 },
		});

		if (existing.data.length > 0) {
			return { created: false, lead: existing.data[0] };
		}

		const lead = await client.contacts.create({
			role: 'lead',
			email: searchField === 'email' ? searchValue : undefined,
			external_id: searchField === 'external_id' ? searchValue : undefined,
			name,
			phone,
			custom_attributes: customAttributes,
		});

		return { created: true, lead };
	},
});
