import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const disableContactPaymentRemindersAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_disable_contact_payment_reminders',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Disable Contact Payment Reminders',
	description: 'Stops automated payment reminders for a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Turns off automated payment reminder emails for one contact; re-enable with Enable Contact Payment Reminders. Use List Contacts to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.disableContactPaymentReminders({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
