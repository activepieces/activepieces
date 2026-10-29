import { createAction } from '@activepieces/pieces-framework';

import { mauticListEmailsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListEmailsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_emails',
	outputSchema: mauticListEmailsOutputSchema,
	displayName: 'List Emails',
	description: 'Lists Mautic emails.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists emails with their type, subject and sent counts. Use Search for free text or Where for exact column conditions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'emails',
			key: 'emails',
			query: context.propsValue,
		});
	},
});
