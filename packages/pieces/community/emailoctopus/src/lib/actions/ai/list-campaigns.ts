import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { listCampaignsOutputSchema } from '../../output-schemas';

export const listCampaignsAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_list_campaigns',
	outputSchema: listCampaignsOutputSchema,
	displayName: 'List Campaigns',
	description: 'Lists the campaigns in the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists EmailOctopus campaigns one page at a time, with status, subject, sender and send time. Use it to find the campaign ID the report actions need. Returns `paging.next.starting_after` for the next page.',
		idempotent: true,
	},
	props: {
		limit: emailOctopusAiProps.limit({ required: false }),
		startingAfter: emailOctopusAiProps.startingAfter({ required: false }),
	},
	async run(context) {
		const { limit, startingAfter } = context.propsValue;
		return await emailOctopusApi.listCampaignsPage({
			auth: context.auth,
			limit: limit ?? undefined,
			startingAfter: startingAfter ?? undefined,
		});
	},
});
