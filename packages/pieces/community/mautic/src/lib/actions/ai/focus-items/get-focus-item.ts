import { createAction } from '@activepieces/pieces-framework';

import { mauticGetFocusItemOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetFocusItemAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_focus_item',
	outputSchema: mauticGetFocusItemOutputSchema,
	displayName: 'Get Focus Item',
	description: 'Gets one Mautic focus item by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single focus item by its numeric id. Needs the Focus plugin.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Focus Item Id',
			description: 'Numeric focus item id, from List Focus Items or Create Focus Item.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'focus',
			id: context.propsValue.id,
		});
	},
});
