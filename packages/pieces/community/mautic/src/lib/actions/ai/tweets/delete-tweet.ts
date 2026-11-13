import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteTweetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteTweetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_tweet',
	outputSchema: mauticDeleteTweetOutputSchema,
	displayName: 'Delete Tweet',
	description: 'Permanently deletes a Mautic tweet.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a tweet template. Needs the Social plugin. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tweet Id',
			description: 'Numeric tweet id, from List Tweets or Create Tweet.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'tweets',
			id: context.propsValue.id,
		});
	},
});
