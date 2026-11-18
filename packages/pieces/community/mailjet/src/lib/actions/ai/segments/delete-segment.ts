import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteSegmentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_segment',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Segment',
	description: 'Deletes a contact segment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a segment. Contacts are not affected. Mailjet keeps the record: Get Segment then returns it with Status "deleted".',
		idempotent: false,
	},
	props: {
		segmentId: mailjetAiProps.id({
			displayName: 'Segment ID',
			description: 'Numeric segment ID, from List Segments or Create Segment.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/contactfilter/${encodeURIComponent(p.segmentId)}`,
		});
	},
});
