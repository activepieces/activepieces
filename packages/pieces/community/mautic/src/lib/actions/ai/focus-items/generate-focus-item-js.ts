import { createAction } from '@activepieces/pieces-framework';

import { mauticGenerateFocusItemJsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGenerateFocusItemJsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_generate_focus_item_js',
	outputSchema: mauticGenerateFocusItemJsOutputSchema,
	displayName: 'Generate Focus Item JS',
	description: 'Gets the embed JavaScript of a Mautic focus item.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the JavaScript that shows a focus item on a website. Read-only. Needs the Focus plugin.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Focus Item Id',
			description: 'Numeric focus item id, from List Focus Items or Create Focus Item.',
		}),
	},
	async run(context) {
		return await mauticApi.generateFocusItemJs({ auth: context.auth, id: context.propsValue.id });
	},
});
