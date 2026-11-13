import { createAction } from '@activepieces/pieces-framework';

import { mauticDeletePointGroupOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePointGroupAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_point_group',
	outputSchema: mauticDeletePointGroupOutputSchema,
	displayName: 'Delete Point Group',
	description: 'Permanently deletes a Mautic point group.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a point group and every contact score in it. Needs Mautic 5.1 or later. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Group Id',
			description: 'Numeric point group id, from List Point Groups or Create Point Group.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'points/groups',
			id: context.propsValue.id,
		});
	},
});
