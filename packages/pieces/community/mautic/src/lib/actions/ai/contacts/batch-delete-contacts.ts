import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticBatchDeleteContactsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchDeleteContactsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_delete_contacts',
	outputSchema: mauticBatchDeleteContactsOutputSchema,
	displayName: 'Batch Delete Contacts',
	description: 'Permanently deletes several Mautic contacts.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes up to 200 contacts by id in one request. Cannot be undone.',
		idempotent: false,
	},
	props: {
		ids: Property.Array({
			displayName: 'Contact Ids',
			description: 'Numeric contact ids, from List Contacts.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.batchDeleteRecords({
			auth: context.auth,
			resource: 'contacts',
			ids: mauticUtils.toBatchIds({ ids: context.propsValue.ids }),
		});
	},
});
