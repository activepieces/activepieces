import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFormOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteFormAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_form',
	outputSchema: mauticDeleteFormOutputSchema,
	displayName: 'Delete Form',
	description: 'Permanently deletes a Mautic form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a form and its submissions. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms or Create Form.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'forms',
			id: context.propsValue.id,
		});
	},
});
