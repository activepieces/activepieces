import { createAction } from '@activepieces/pieces-framework';

import { mauticListFocusItemsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListFocusItemsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_focus_items',
	outputSchema: mauticListFocusItemsOutputSchema,
	displayName: 'List Focus Items',
	description: 'Lists Mautic focus items.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists focus items (website pop-ups, bars and notices). Needs the Focus plugin. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'focus',
			key: 'focus',
			query: context.propsValue,
		});
	},
});
