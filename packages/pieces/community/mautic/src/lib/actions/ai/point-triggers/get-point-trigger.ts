import { createAction } from '@activepieces/pieces-framework';

import { mauticCreatePointTriggerOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPointTriggerAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_point_trigger',
	outputSchema: mauticCreatePointTriggerOutputSchema,
	displayName: 'Get Point Trigger',
	description: 'Gets one Mautic point trigger by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single point trigger by its numeric id, with its events.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Trigger Id',
			description: 'Numeric point trigger id, from List Point Triggers or Create Point Trigger.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'points/triggers',
			id: context.propsValue.id,
		});
	},
});
