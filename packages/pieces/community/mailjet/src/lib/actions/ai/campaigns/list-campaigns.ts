import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetListCampaignsAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_list_campaigns',
	outputSchema: mailjetCampaignOutputSchema,
	displayName: 'List Campaigns',
	description: 'Lists sent campaigns.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists sent campaigns (marketing and transactional groups) with their IDs and send dates. Filter by contact list, custom campaign name or deleted/starred state. Page with Limit and Offset.',
		idempotent: true,
	},
	props: {
		contactsListId: Property.Number({
			displayName: 'Contact List ID',
			description: 'Only campaigns sent to this list.',
			required: false,
		}),
		customCampaign: Property.ShortText({
			displayName: 'Custom Campaign',
			description: 'Only the campaign with this custom name.',
			required: false,
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes for starred campaigns only.',
		}),
		isDeleted: mailjetAiProps.yesNo({
			displayName: 'Deleted',
			description: 'Yes for deleted campaigns only.',
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/campaign',
			query: {
				ContactsListID: p.contactsListId,
				CustomCampaign: p.customCampaign,
				IsStarred: p.isStarred,
				IsDeleted: p.isDeleted,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
