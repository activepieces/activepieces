import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { findGroupsByNameOutputSchema } from '../output-schemas';

export const findGroupsByNameAction = createAction({
	auth: mailerLiteAuth,
	name: 'find_groups_by_name',
	classification: 'SEARCH',
	displayName: 'Find Groups by Name',
	description: 'Find subscriber groups whose name contains a text.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Search MailerLite groups by name (partial, case-insensitive match) and return the matching groups with their IDs and subscriber counts. Use it to resolve a group name to the group ID other actions need. Page-paginated: use meta.last_page and pass page to get more. Read-only.',
		idempotent: true,
	},
	outputSchema: findGroupsByNameOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Text the group name must contain.',
			required: true,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order; a minus prefix means descending.',
			required: false,
			options: {
				options: [
					{ label: 'Name', value: 'name' },
					{ label: 'Name (desc)', value: '-name' },
					{ label: 'Total', value: 'total' },
					{ label: 'Total (desc)', value: '-total' },
					{ label: 'Open rate', value: 'open_rate' },
					{ label: 'Open rate (desc)', value: '-open_rate' },
					{ label: 'Click rate', value: 'click_rate' },
					{ label: 'Click rate (desc)', value: '-click_rate' },
					{ label: 'Created at', value: 'created_at' },
					{ label: 'Created at (desc)', value: '-created_at' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-1000, default 25).',
			required: false,
			defaultValue: 25,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to return, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/groups',
			queryParams: {
				'filter[name]': context.propsValue.name,
				'sort': context.propsValue.sort,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 25, max: 1000 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
