import { createAction } from '@activepieces/pieces-framework';

import { mauticListMarketingMessagesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListMarketingMessagesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_marketing_messages',
	outputSchema: mauticListMarketingMessagesOutputSchema,
	displayName: 'List Marketing Messages',
	description: 'Lists Mautic marketing messages.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists marketing messages, which send through the channel each contact prefers. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'messages',
			key: 'messages',
			query: context.propsValue,
		});
	},
});
