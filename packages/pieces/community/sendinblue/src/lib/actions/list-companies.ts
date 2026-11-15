import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listCompaniesActionOutputSchema } from '../output-schemas';

export const listCompanies = createAction({
	auth: sendinblueAuth,
	name: 'list_companies',
	outputSchema: listCompaniesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Companies',
	description: 'List and filter Brevo CRM companies.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Brevo CRM companies with pagination, sorting and an optional raw filter string, and can filter by linked contact or deal ids. Use this to find a company id before calling Get Company, Delete Company, or to check whether a company already exists before Create Company. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		page: Property.Number({
			displayName: 'Page',
			description: '1-based page index.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of companies to return per page. Maximum 100.',
			required: false,
			defaultValue: 50,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order for the results.',
			required: false,
			options: {
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
		sort_by: Property.ShortText({
			displayName: 'Sort By',
			description: 'Field to sort by, e.g. createdAt or name.',
			required: false,
		}),
		filters: Property.ShortText({
			displayName: 'Filters',
			description:
				'Raw JSON filter string per Brevo\'s docs, e.g. {"attributes.name":"Acme"}.',
			required: false,
		}),
		linked_contacts_ids: Property.Array({
			displayName: 'Linked Contact IDs',
			description: 'Only return companies linked to any of these Brevo contact ids.',
			required: false,
		}),
		linked_deals_ids: Property.Array({
			displayName: 'Linked Deal IDs',
			description: 'Only return companies linked to any of these Brevo deal ids.',
			required: false,
		}),
	},
	async run(context) {
		const { page, limit, sort, sort_by, filters, linked_contacts_ids, linked_deals_ids } =
			context.propsValue;

		const linkedContactsIds = (linked_contacts_ids ?? [])
			.map((contactId) => Number(contactId))
			.filter((contactId) => Number.isFinite(contactId));

		const linkedDealsIds = (Array.isArray(linked_deals_ids) ? linked_deals_ids : [])
			.map((dealId) => String(dealId).trim())
			.filter((dealId) => dealId.length > 0);

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/companies',
			query: {
				page,
				limit,
				sort,
				sortBy: sort_by,
				filters,
				linkedContactsIds: linkedContactsIds.length > 0 ? linkedContactsIds.join(',') : undefined,
				linkedDealsIds: linkedDealsIds.length > 0 ? linkedDealsIds.join(',') : undefined,
			},
		});
	},
});
