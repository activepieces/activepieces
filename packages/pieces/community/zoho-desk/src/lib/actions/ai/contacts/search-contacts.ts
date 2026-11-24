import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_contacts',
	outputSchema: zohoDeskSearchContactsOutputSchema,
	displayName: 'Search Contacts',
	description: 'Searches contacts by text, name, email, phone or account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches contacts by free text (supports a trailing * wildcard), name, email, phone, mobile, account name or time range. Use it to resolve an email address to a Contact ID before creating a ticket. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched across contact fields; end with * for a prefix match.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Exact email address.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		mobile: Property.ShortText({
			displayName: 'Mobile',
			description: 'Mobile number.',
			required: false,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'First name.',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Last name.',
			required: false,
		}),
		fullName: Property.ShortText({
			displayName: 'Full Name',
			description: 'Full name.',
			required: false,
		}),
		accountName: Property.ShortText({
			displayName: 'Account Name',
			description: "Name of the contact's account.",
			required: false,
		}),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort order.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'relevance', value: 'relevance' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: 'createdTime', value: 'createdTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			email,
			phone,
			mobile,
			firstName,
			lastName,
			fullName,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		} = context.propsValue;
		const contacts = await zohoDeskApi.searchContactsByFilter({
			auth: context.auth,
			orgId,
			searchText,
			email,
			phone,
			mobile,
			firstName,
			lastName,
			fullName,
			accountName,
			createdTimeRange,
			modifiedTimeRange,
			sortBy,
			from,
			limit,
		});
		return { contacts, count: contacts.length };
	},
});
