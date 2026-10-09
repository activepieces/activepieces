import { createAction } from '@activepieces/pieces-framework';

import { mauticDeletePointActionOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePointActionAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_point_action',
	outputSchema: mauticDeletePointActionOutputSchema,
	displayName: 'Delete Point Action',
	description: 'Permanently deletes a Mautic point action.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a point action; points already given stay. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Action Id',
			description: 'Numeric point action id, from List Point Actions or Create Point Action.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'points',
			id: context.propsValue.id,
		});
	},
});
