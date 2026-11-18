import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteEmailOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteEmailAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_email',
	outputSchema: mauticDeleteEmailOutputSchema,
	displayName: 'Delete Email',
	description: 'Permanently deletes a Mautic email.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes an email and its stats. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Email Id',
			description: 'Numeric email id, from List Emails or Create Email.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'emails',
			id: context.propsValue.id,
		});
	},
});
