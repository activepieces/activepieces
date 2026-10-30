import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceTimeEntryOutputSchema } from '../../../output-schemas';

export const getRunningTimerAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_running_timer',
	outputSchema: zohoInvoiceTimeEntryOutputSchema,
	displayName: 'Get Running Timer',
	description: "Gets the current user's running timer.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the time entry whose timer is running for the connected user, with its project, task and elapsed time. Use it before Stop Timer or Start Timer to check what is running.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getRunningTimeEntryTimer({
			auth,
			organizationId: propsValue.organizationId,
		});
	},
});
