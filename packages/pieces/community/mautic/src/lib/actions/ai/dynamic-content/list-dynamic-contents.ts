import { createAction } from '@activepieces/pieces-framework';

import { mauticListDynamicContentsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListDynamicContentsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_dynamic_contents',
	outputSchema: mauticListDynamicContentsOutputSchema,
	displayName: 'List Dynamic Contents',
	description: 'Lists Mautic dynamic contents.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists dynamic content items, the personalized HTML blocks for websites and emails. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'dynamiccontents',
			key: 'dynamicContents',
			query: context.propsValue,
		});
	},
});
