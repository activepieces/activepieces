import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteMarketingMessageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteMarketingMessageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_marketing_message',
	outputSchema: mauticDeleteMarketingMessageOutputSchema,
	displayName: 'Delete Marketing Message',
	description: 'Permanently deletes a Mautic marketing message.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a marketing message. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Marketing Message Id',
			description:
				'Numeric marketing message id, from List Marketing Messages or Create Marketing Message.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'messages',
			id: context.propsValue.id,
		});
	},
});
