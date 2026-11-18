import { createAction } from '@activepieces/pieces-framework';

import { mauticGetCompanyOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_company',
	outputSchema: mauticGetCompanyOutputSchema,
	displayName: 'Get Company',
	description: 'Gets one Mautic company by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a single company by its numeric id, with all field values. Get the id from List Companies.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Company Id',
			description: 'Numeric company id, from List Companies or Create Company.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'companies',
			id: context.propsValue.id,
		});
	},
});
