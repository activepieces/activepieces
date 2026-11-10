import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const startTimerAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_start_timer',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Start Timer',
	description: 'Starts the timer on an existing time entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts (or resumes) the timer on an existing time entry of the current user. Use List Time Entries to find the ID, or Create Time Entry with Start Timer for a new one; stop it with Stop Timer.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		timeEntryId: zohoInvoiceAiProps.timeEntryId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.startTimeEntryTimer({
			auth,
			organizationId: propsValue.organizationId,
			timeEntryId: propsValue.timeEntryId,
		});
	},
});
