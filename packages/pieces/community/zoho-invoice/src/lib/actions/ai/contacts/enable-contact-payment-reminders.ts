import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const enableContactPaymentRemindersAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_enable_contact_payment_reminders',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Enable Contact Payment Reminders',
	description: 'Turns on automated payment reminders for a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Turns on automated payment reminder emails for one contact, using the reminders configured in the organization. Use List Contacts to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.enableContactPaymentReminders({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
		});
	},
});
