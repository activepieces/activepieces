import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteStageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_stage',
	outputSchema: mauticDeleteStageOutputSchema,
	displayName: 'Delete Stage',
	description: 'Permanently deletes a Mautic stage.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a stage; contacts in it are left without a stage. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Stage Id',
			description: 'Numeric stage id, from List Stages or Create Stage.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'stages',
			id: context.propsValue.id,
		});
	},
});
