import { createAction } from '@activepieces/pieces-framework';

import { mauticListSmsesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListSmsesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_smses',
	outputSchema: mauticListSmsesOutputSchema,
	displayName: 'List Text Messages',
	description: 'Lists Mautic text messages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists text messages (SMS templates) with their sent counts. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'smses',
			key: 'smses',
			query: context.propsValue,
		});
	},
});
