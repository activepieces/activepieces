import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const stopTimerAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_stop_timer',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Stop Timer',
	description: "Stops the current user's running timer.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops the running timer of the connected user and saves the elapsed time on its time entry. Takes no ID: a user has at most one running timer, see Get Running Timer. Fails when no timer is running.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.stopTimeEntryTimer({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
