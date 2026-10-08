import { createAction } from '@activepieces/pieces-framework';

import { mauticBatchUpdateCompaniesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchUpdateCompaniesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_update_companies',
	outputSchema: mauticBatchUpdateCompaniesOutputSchema,
	displayName: 'Batch Update Companies',
	description: 'Updates several Mautic companies in one request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates up to 200 companies in one request. Each record has the company "id" plus only the fields to change; other fields are left alone. Per-record errors are in the response.',
		idempotent: true,
	},
	props: {
		records: mauticAiProps.records({
			description:
				'Companies to update, each an object with "id" and the field values to change, keyed by field alias.',
		}),
	},
	async run(context) {
		return await mauticApi.batchUpdateRecords({
			auth: context.auth,
			resource: 'companies',
			records: mauticUtils.toBatchRecords({ records: context.propsValue.records }),
		});
	},
});
