import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetSegmentOutputSchema } from '../../output-schemas';

export const senderGetSegmentAction = createAction({
	auth: senderAuth,
	name: 'sender_get_segment',
	outputSchema: senderGetSegmentOutputSchema,
	displayName: 'Get Segment',
	description: 'Gets a segment by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one segment by ID, with its conditions and subscriber counts.',
		idempotent: true,
	},
	props: {
		segmentId: senderAiProps.segmentId({ required: true }),
	},
	async run(context) {
		return await senderApi.getSegment({ auth: context.auth, ...context.propsValue });
	},
});
