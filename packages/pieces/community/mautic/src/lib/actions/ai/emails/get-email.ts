import { createAction } from '@activepieces/pieces-framework';

import { mauticCreateEmailOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetEmailAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_email',
	outputSchema: mauticCreateEmailOutputSchema,
	displayName: 'Get Email',
	description: 'Gets one Mautic email by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a single email by its numeric id, with content, segments and sent/read counts.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Email Id',
			description: 'Numeric email id, from List Emails or Create Email.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'emails',
			id: context.propsValue.id,
		});
	},
});
