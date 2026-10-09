import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticBatchDeleteCompaniesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchDeleteCompaniesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_delete_companies',
	outputSchema: mauticBatchDeleteCompaniesOutputSchema,
	displayName: 'Batch Delete Companies',
	description: 'Permanently deletes several Mautic companies.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes up to 200 companies by id in one request. Cannot be undone.',
		idempotent: false,
	},
	props: {
		ids: Property.Array({
			displayName: 'Company Ids',
			description: 'Numeric company ids, from List Companies.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.batchDeleteRecords({
			auth: context.auth,
			resource: 'companies',
			ids: mauticUtils.toBatchIds({ ids: context.propsValue.ids }),
		});
	},
});
