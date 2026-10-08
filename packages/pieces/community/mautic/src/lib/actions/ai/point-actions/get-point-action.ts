import { createAction } from '@activepieces/pieces-framework';

import { mauticGetPointActionOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPointActionAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_point_action',
	outputSchema: mauticGetPointActionOutputSchema,
	displayName: 'Get Point Action',
	description: 'Gets one Mautic point action by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single point action by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Action Id',
			description: 'Numeric point action id, from List Point Actions or Create Point Action.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'points',
			id: context.propsValue.id,
		});
	},
});
