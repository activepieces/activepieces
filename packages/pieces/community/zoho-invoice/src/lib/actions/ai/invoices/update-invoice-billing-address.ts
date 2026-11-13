import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceBillingAddressOutputSchema } from '../../../output-schemas';

export const updateInvoiceBillingAddressAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_invoice_billing_address',
	outputSchema: zohoInvoiceBillingAddressOutputSchema,
	displayName: 'Update Invoice Billing Address',
	description: 'Changes the billing address shown on one invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the billing address on one invoice only; the customer record is not changed. Fields left empty are not sent. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		address: Property.LongText({
			displayName: 'Street Address',
			description: 'Street address.',
			required: false,
		}),
		city: Property.ShortText({ displayName: 'City', description: 'City.', required: false }),
		state: Property.ShortText({
			displayName: 'State',
			description: 'State or region.',
			required: false,
		}),
		zip: Property.ShortText({
			displayName: 'ZIP Code',
			description: 'ZIP or postal code.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country.',
			required: false,
		}),
		fax: Property.ShortText({ displayName: 'Fax', description: 'Fax number.', required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateInvoiceBillingAddress({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			body: zohoInvoiceUtils.compact({
				address: propsValue.address,
				city: propsValue.city,
				state: propsValue.state,
				zip: propsValue.zip,
				country: propsValue.country,
				fax: propsValue.fax,
			}),
		});
	},
});
