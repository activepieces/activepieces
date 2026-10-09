import { createAction } from '@activepieces/pieces-framework';

import { mauticBatchCreateContactsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchCreateContactsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_create_contacts',
	outputSchema: mauticBatchCreateContactsOutputSchema,
	displayName: 'Batch Create Contacts',
	description: 'Creates several Mautic contacts in one request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates up to 200 contacts in one request. Each record is an object of field values keyed by alias, e.g. {"email": "jane@example.com", "firstname": "Jane"}. Mautic merges records whose unique identifier (email by default) matches an existing contact. Per-record errors are in the response.',
		idempotent: false,
	},
	props: {
		records: mauticAiProps.records({
			description: 'Contacts to create, each an object of field values keyed by field alias.',
		}),
	},
	async run(context) {
		return await mauticApi.batchCreateRecords({
			auth: context.auth,
			resource: 'contacts',
			records: mauticUtils.toBatchRecords({ records: context.propsValue.records }),
		});
	},
});
