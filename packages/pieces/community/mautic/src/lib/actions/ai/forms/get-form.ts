import { createAction } from '@activepieces/pieces-framework';

import { mauticCreateFormOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetFormAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_form',
	outputSchema: mauticCreateFormOutputSchema,
	displayName: 'Get Form',
	description: 'Gets one Mautic form by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single form by its numeric id, with its fields and submit actions.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms or Create Form.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'forms',
			id: context.propsValue.id,
		});
	},
});
