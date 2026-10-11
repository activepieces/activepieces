import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listFieldsOutputSchema } from '../output-schemas';

export const listFieldsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_fields',
	classification: 'SEARCH',
	displayName: 'List Fields',
	description: 'List the subscriber fields in the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List MailerLite subscriber fields (default and custom) with their IDs, keys and types. The key is what goes into a subscriber\'s fields object. Optionally filter by keyword or type. Page-paginated. Read-only.',
		idempotent: true,
	},
	outputSchema: listFieldsOutputSchema,
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword',
			description: 'Only return fields whose name contains this text.',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Only return fields of this type.',
			required: false,
			options: {
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'Number', value: 'number' },
					{ label: 'Date', value: 'date' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-100, default 100).',
			required: false,
			defaultValue: 100,
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
			path: '/fields',
			queryParams: {
				'filter[keyword]': context.propsValue.keyword,
				'filter[type]': context.propsValue.type,
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 100, max: 100 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
