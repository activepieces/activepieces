import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteCompanyOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_company',
	outputSchema: mauticDeleteCompanyOutputSchema,
	displayName: 'Delete Company',
	description: 'Permanently deletes a Mautic company.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a company. Its contacts are kept but unlinked. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Company Id',
			description: 'Numeric company id, from List Companies or Create Company.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'companies',
			id: context.propsValue.id,
		});
	},
});
