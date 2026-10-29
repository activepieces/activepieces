import { createAction } from '@activepieces/pieces-framework';

import { mauticListPointGroupsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListPointGroupsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_groups',
	outputSchema: mauticListPointGroupsOutputSchema,
	displayName: 'List Point Groups',
	description: 'Lists Mautic point groups.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists point groups, which keep separate scores per contact. Needs Mautic 5.1 or later. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'points/groups',
			key: 'pointGroups',
			query: context.propsValue,
		});
	},
});
