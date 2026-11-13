import { createAction } from '@activepieces/pieces-framework';

import { mauticListPointActionTypesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListPointActionTypesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_action_types',
	outputSchema: mauticListPointActionTypesOutputSchema,
	displayName: 'List Point Action Types',
	description: 'Lists the Mautic point action types.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the action type keys and labels that Create Point Action takes as Type.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listPointTypes({ auth: context.auth, kind: 'actions' });
	},
});
