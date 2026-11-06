import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markContactPersonPrimaryAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_contact_person_primary',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Contact Person Primary',
	description: 'Makes a contact person the primary person of their contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Makes one contact person the primary person of their contact; the previous primary person stays as a regular contact person. Use List Contact Persons to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactPersonId: zohoInvoiceAiProps.contactPersonId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markContactPersonPrimary({
			auth,
			organizationId: propsValue.organizationId,
			contactPersonId: propsValue.contactPersonId,
		});
	},
});
