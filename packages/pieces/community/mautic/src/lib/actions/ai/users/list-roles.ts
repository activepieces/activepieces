import { createAction } from '@activepieces/pieces-framework';

import { mauticListRolesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListRolesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_roles',
	outputSchema: mauticListRolesOutputSchema,
	displayName: 'List Roles',
	description: 'Lists Mautic roles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists user roles with their permissions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'roles',
			key: 'roles',
			query: context.propsValue,
		});
	},
});
