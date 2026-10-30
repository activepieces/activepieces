import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageWithDataOutputSchema } from '../../../output-schemas';

export const deleteTimeEntryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_time_entry',
	outputSchema: zohoInvoiceMessageWithDataOutputSchema,
	displayName: 'Delete Time Entry',
	description: 'Deletes a time entry from Zoho Invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one time entry. Use List Time Entries to find the ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		timeEntryId: zohoInvoiceAiProps.timeEntryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteTimeEntry({
			auth,
			organizationId: propsValue.organizationId,
			timeEntryId: propsValue.timeEntryId,
		});
	},
});
