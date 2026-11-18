import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListFieldsOutputSchema } from '../../output-schemas';

export const senderListFieldsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_fields',
	outputSchema: senderListFieldsOutputSchema,
	displayName: 'List Fields',
	description: 'Lists the custom subscriber fields.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the subscriber fields in the account, default and custom, with their ID, title, type and name. To set a value with Create or Update Subscriber or Update Subscriber, key it as {$<name>}: a field named "{{company}}" takes the key "{$company}".',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listFields({ auth: context.auth, ...context.propsValue });
	},
});
