import { createAction } from '@activepieces/pieces-framework';

import { mauticBatchCreateCompaniesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchCreateCompaniesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_create_companies',
	outputSchema: mauticBatchCreateCompaniesOutputSchema,
	displayName: 'Batch Create Companies',
	description: 'Creates several Mautic companies in one request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates up to 200 companies in one request. Each record is an object of field values keyed by alias and needs "companyname", e.g. {"companyname": "Acme", "companywebsite": "https://acme.com"}. Per-record errors are in the response.',
		idempotent: false,
	},
	props: {
		records: mauticAiProps.records({
			description: 'Companies to create, each an object of field values keyed by field alias.',
		}),
	},
	async run(context) {
		return await mauticApi.batchCreateRecords({
			auth: context.auth,
			resource: 'companies',
			records: mauticUtils.toBatchRecords({ records: context.propsValue.records }),
		});
	},
});
