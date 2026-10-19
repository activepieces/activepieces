import { createAction } from '@activepieces/pieces-framework';

import { mauticBatchUpdateContactsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchUpdateContactsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_update_contacts',
	outputSchema: mauticBatchUpdateContactsOutputSchema,
	displayName: 'Batch Update Contacts',
	description: 'Updates several Mautic contacts in one request.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates up to 200 contacts in one request. Each record has the contact "id" plus only the fields to change; other fields are left alone. Per-record errors are in the response.',
		idempotent: true,
	},
	props: {
		records: mauticAiProps.records({
			description:
				'Contacts to update, each an object with "id" and the field values to change, keyed by field alias.',
		}),
	},
	async run(context) {
		return await mauticApi.batchUpdateRecords({
			auth: context.auth,
			resource: 'contacts',
			records: mauticUtils.toBatchRecords({ records: context.propsValue.records }),
		});
	},
});
