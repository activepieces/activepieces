import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListSegmentsOutputSchema } from '../../output-schemas';

export const senderListSegmentsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_segments',
	outputSchema: senderListSegmentsOutputSchema,
	displayName: 'List Segments',
	description: 'Lists one page of segments.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of segments (saved subscriber filters) with their ID, name, conditions and subscriber counts. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listSegments({ auth: context.auth, ...context.propsValue });
	},
});
