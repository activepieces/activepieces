import { createAction } from '@activepieces/pieces-framework';

import { mailjetSegmentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListSegmentsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_segments',
	outputSchema: mailjetSegmentOutputSchema,
	displayName: 'List Segments',
	description: 'Lists the contact segments of the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists segments (contact filters) with their IDs, names and expressions. Segment IDs are used as the segment of a campaign draft. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		showDeleted: mailjetAiProps.yesNo({
			displayName: 'Show Deleted',
			description: 'Yes includes deleted segments.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactfilter',
			query: { ShowDeleted: p.showDeleted, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
