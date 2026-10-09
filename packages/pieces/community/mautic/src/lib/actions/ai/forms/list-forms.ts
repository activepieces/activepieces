import { createAction } from '@activepieces/pieces-framework';

import { mauticListFormsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListFormsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_forms',
	outputSchema: mauticListFormsOutputSchema,
	displayName: 'List Forms',
	description: 'Lists Mautic forms.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists forms with their fields and submit actions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'forms',
			key: 'forms',
			query: context.propsValue,
		});
	},
});
