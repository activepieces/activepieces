import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignOverviewOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListCampaignOverviewsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_campaign_overviews',
	outputSchema: mailjetCampaignOverviewOutputSchema,
	displayName: 'List Campaign Overviews',
	description: 'Lists campaigns with their key statistics.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists campaigns and drafts with subject, send date and delivered/opened/clicked counts. Filter by sent, draft, scheduled, archived or starred. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		sent: mailjetAiProps.yesNo({ displayName: 'Sent', description: 'Yes for sent campaigns.' }),
		drafts: mailjetAiProps.yesNo({ displayName: 'Drafts', description: 'Yes for drafts.' }),
		programmed: mailjetAiProps.yesNo({
			displayName: 'Scheduled',
			description: 'Yes for scheduled campaigns.',
		}),
		archived: mailjetAiProps.yesNo({
			displayName: 'Archived',
			description: 'Yes for archived campaigns.',
		}),
		starred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes for starred campaigns.',
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Only campaigns with this subject.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/campaignoverview',
			query: {
				Sent: p.sent,
				Drafts: p.drafts,
				Programmed: p.programmed,
				Archived: p.archived,
				Starred: p.starred,
				Subject: p.subject,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
