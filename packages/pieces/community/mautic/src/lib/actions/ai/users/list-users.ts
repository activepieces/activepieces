import { createAction } from '@activepieces/pieces-framework';

import { mauticListUsersOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListUsersAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_users',
	outputSchema: mauticListUsersOutputSchema,
	displayName: 'List Users',
	description: 'Lists Mautic users.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Mautic users with their role. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'users',
			key: 'users',
			query: context.propsValue,
		});
	},
});
