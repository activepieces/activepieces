import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listSegmentsOutputSchema } from '../output-schemas';

export const listSegmentsAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_segments',
	classification: 'SEARCH',
	displayName: 'List Segments',
	description: 'List the segments in the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List MailerLite segments (saved subscriber filters created in the dashboard) with their IDs and subscriber totals. Segments cannot be created through the API. Page-paginated: pass page for more. Read-only.',
		idempotent: true,
	},
	outputSchema: listSegmentsOutputSchema,
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items to return (1-250, default 50).',
			required: false,
			defaultValue: 50,
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
			path: '/segments',
			queryParams: {
				limit: mailerLiteApi.resolveLimit({ value: context.propsValue.limit, fallback: 50, max: 250 }),
				page: mailerLiteApi.resolvePage(context.propsValue.page),
			},
		});
		return body;
	},
});
