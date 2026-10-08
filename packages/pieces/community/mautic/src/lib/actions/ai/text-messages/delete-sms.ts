import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteSmsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteSmsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_sms',
	outputSchema: mauticDeleteSmsOutputSchema,
	displayName: 'Delete Text Message',
	description: 'Permanently deletes a Mautic text message.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a text message and its stats. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Text Message Id',
			description: 'Numeric text message id, from List Text Messages or Create Text Message.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'smses',
			id: context.propsValue.id,
		});
	},
});
