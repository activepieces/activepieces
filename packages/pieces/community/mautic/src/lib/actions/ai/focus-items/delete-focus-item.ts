import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFocusItemOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteFocusItemAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_focus_item',
	outputSchema: mauticDeleteFocusItemOutputSchema,
	displayName: 'Delete Focus Item',
	description: 'Permanently deletes a Mautic focus item.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a focus item. Needs the Focus plugin. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Focus Item Id',
			description: 'Numeric focus item id, from List Focus Items or Create Focus Item.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'focus',
			id: context.propsValue.id,
		});
	},
});
