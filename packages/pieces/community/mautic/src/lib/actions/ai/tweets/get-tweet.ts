import { createAction } from '@activepieces/pieces-framework';

import { mauticGetTweetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetTweetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_tweet',
	outputSchema: mauticGetTweetOutputSchema,
	displayName: 'Get Tweet',
	description: 'Gets one Mautic tweet by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single tweet template by its numeric id. Needs the Social plugin.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tweet Id',
			description: 'Numeric tweet id, from List Tweets or Create Tweet.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'tweets',
			id: context.propsValue.id,
		});
	},
});
