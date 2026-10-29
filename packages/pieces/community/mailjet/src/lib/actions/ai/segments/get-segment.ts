import { createAction } from '@activepieces/pieces-framework';

import { mailjetSegmentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetSegmentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_segment',
	outputSchema: mailjetSegmentOutputSchema,
	displayName: 'Get Segment',
	description: 'Gets one contact segment.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a segment by its numeric ID, including its expression.',
		idempotent: true,
	},
	props: {
		segmentId: mailjetAiProps.id({
			displayName: 'Segment ID',
			description: 'Numeric segment ID, from List Segments or Create Segment.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/contactfilter/${encodeURIComponent(p.segmentId)}`,
		});
	},
});
