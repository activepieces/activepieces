import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { listFormsActionOutputSchema } from '../output-schemas';

export const listFormsAction = createAction({
	auth: tallyAuth,
	name: 'list_forms',
	classification: 'SEARCH',
	displayName: 'List Forms',
	description: 'List all forms in your Tally account',
	audience: 'ai',
	outputSchema: listFormsActionOutputSchema,
	aiMetadata: {
		description:
			'Lists forms with pagination, including each form\'s id, name, workspace id, status, submission count, and closed state. Use to discover form ids before calling other form/submission/analytics atomics. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of forms per page (max 500). Defaults to 50.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.listFormsPage({
			apiKey: auth.secret_text,
			page: propsValue.page,
			limit: propsValue.limit,
		});
	},
});
