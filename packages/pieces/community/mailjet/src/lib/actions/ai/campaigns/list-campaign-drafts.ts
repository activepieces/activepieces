import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftWithTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListCampaignDraftsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_campaign_drafts',
	outputSchema: mailjetCampaignDraftWithTemplateOutputSchema,
	displayName: 'List Campaign Drafts',
	description: 'Lists campaign drafts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists campaign drafts with their IDs, subjects, lists and status. Filter by contact list, campaign or status. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only drafts for this list.',
			required: false,
		}),
		campaignId: Property.Number({
			displayName: 'Campaign ID',
			description: 'Only the draft of this sent campaign.',
			required: false,
		}),
		status: Property.Number({
			displayName: 'Status',
			description: 'Draft status code: 0 draft, 1 programmed, 2 sent, -1 archived, -2 deleted.',
			required: false,
		}),
		isArchived: mailjetAiProps.yesNo({
			displayName: 'Archived',
			description: 'Yes for archived drafts only.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/campaigndraft',
			query: {
				ContactsList: p.contactsListId,
				Campaign: p.campaignId,
				Status: p.status,
				IsArchived: p.isArchived,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
