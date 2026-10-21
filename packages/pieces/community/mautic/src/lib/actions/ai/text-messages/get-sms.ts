import { createAction } from '@activepieces/pieces-framework';

import { mauticGetSmsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetSmsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_sms',
	outputSchema: mauticGetSmsOutputSchema,
	displayName: 'Get Text Message',
	description: 'Gets one Mautic text message by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single text message by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Text Message Id',
			description: 'Numeric text message id, from List Text Messages or Create Text Message.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'smses',
			id: context.propsValue.id,
		});
	},
});
