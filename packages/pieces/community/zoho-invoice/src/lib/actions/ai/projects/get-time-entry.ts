import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const getTimeEntryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_time_entry',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Get Time Entry',
	description: 'Gets one time entry from Zoho Invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one time entry by ID with its project, task, user, date, duration, timer state and billed status. Use List Time Entries to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		timeEntryId: zohoInvoiceAiProps.timeEntryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getTimeEntry({
			auth,
			organizationId: propsValue.organizationId,
			timeEntryId: propsValue.timeEntryId,
		});
	},
});
