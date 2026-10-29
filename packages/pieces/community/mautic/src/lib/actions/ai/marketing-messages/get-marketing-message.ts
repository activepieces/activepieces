import { createAction } from '@activepieces/pieces-framework';

import { mauticGetMarketingMessageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetMarketingMessageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_marketing_message',
	outputSchema: mauticGetMarketingMessageOutputSchema,
	displayName: 'Get Marketing Message',
	description: 'Gets one Mautic marketing message by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single marketing message by its numeric id, with its channels.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Marketing Message Id',
			description:
				'Numeric marketing message id, from List Marketing Messages or Create Marketing Message.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'messages',
			id: context.propsValue.id,
		});
	},
});
