import { createAction } from '@activepieces/pieces-framework';

import { mailjetContactStatisticsOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListContactStatisticsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_contact_statistics',
	outputSchema: mailjetContactStatisticsOutputSchema,
	displayName: 'List Contact Statistics',
	description: 'Lists per-contact sending and engagement counts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists, per contact, how many messages were sent, opened, clicked, bounced or marked spam. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		click: mailjetAiProps.yesNo({
			displayName: 'Clicked',
			description: 'Yes for contacts that clicked.',
		}),
		open: mailjetAiProps.yesNo({
			displayName: 'Opened',
			description: 'Yes for contacts that opened.',
		}),
		bounced: mailjetAiProps.yesNo({
			displayName: 'Bounced',
			description: 'Yes for contacts with bounces.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/contactstatistics',
			query: { Click: p.click, Open: p.open, Bounced: p.bounced, ...mailjetUtils.pagingQuery(p) },
		});
	},
});
