import { createAction } from '@activepieces/pieces-framework';

import { mauticGetPointGroupOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetPointGroupAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_point_group',
	outputSchema: mauticGetPointGroupOutputSchema,
	displayName: 'Get Point Group',
	description: 'Gets one Mautic point group by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single point group by its numeric id. Needs Mautic 5.1 or later.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Group Id',
			description: 'Numeric point group id, from List Point Groups or Create Point Group.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'points/groups',
			id: context.propsValue.id,
		});
	},
});
