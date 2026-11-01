import { createAction } from '@activepieces/pieces-framework';

import { mauticGetStageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_stage',
	outputSchema: mauticGetStageOutputSchema,
	displayName: 'Get Stage',
	description: 'Gets one Mautic stage by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single stage by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Stage Id',
			description: 'Numeric stage id, from List Stages or Create Stage.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'stages',
			id: context.propsValue.id,
		});
	},
});
