import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyForm, TallyPaginated } from '../common/types';
import { listFormsOutputSchema } from '../output-schemas';

export const listForms = createAction({
	auth: tallyAuth,
	name: 'list_forms',
	displayName: 'List Forms',
	description: 'Lists forms accessible to the authenticated user, paginated.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists forms accessible to the authenticated user. Returns a page of forms with id, name, and status, plus a `hasMore` flag and the current page. Use to discover a form id before calling Get Form, Update Form, or any submission/analytics/webhook action for a specific form. Increment the `page` prop to walk further pages when `hasMore` is true.',
		idempotent: true,
	},
	outputSchema: listFormsOutputSchema,
	props: {
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number to fetch, starting at 1.',
			required: false,
			defaultValue: 1,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of forms per page (max 100).',
			required: false,
			defaultValue: 50,
		}),
	},
	async run(context) {
		const page = context.propsValue.page ?? 1;
		const limit = context.propsValue.limit ?? 50;
		return tallyApiClient.request<TallyPaginated<TallyForm>>({
			method: HttpMethod.GET,
			path: '/forms',
			apiKey: context.auth.secret_text,
			queryParams: { page: String(page), limit: String(limit) },
		});
	},
});
