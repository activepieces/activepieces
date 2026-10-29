import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceBillingAddressOutputSchema } from '../../../output-schemas';

export const updateEstimateBillingAddressAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_estimate_billing_address',
	outputSchema: zohoInvoiceBillingAddressOutputSchema,
	displayName: 'Update Estimate Billing Address',
	description: 'Changes the billing address printed on one estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes the billing address on one estimate only, not on the customer's contact. Fields left empty keep their current value. Use List Estimates to find the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		address: Property.ShortText({
			displayName: 'Street',
			description: 'Street address. Empty = unchanged.',
			required: false,
		}),
		city: Property.ShortText({
			displayName: 'City',
			description: 'City. Empty = unchanged.',
			required: false,
		}),
		state: Property.ShortText({
			displayName: 'State',
			description: 'State or region. Empty = unchanged.',
			required: false,
		}),
		zip: Property.ShortText({
			displayName: 'ZIP Code',
			description: 'ZIP or postal code. Empty = unchanged.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country. Empty = unchanged.',
			required: false,
		}),
		fax: Property.ShortText({
			displayName: 'Fax',
			description: 'Fax number. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, estimateId } = propsValue;
		const current = await zohoInvoiceApi.getEstimate({ auth, organizationId, estimateId });
		const address = current.estimate?.billing_address;
		return await zohoInvoiceApi.updateEstimateBillingAddress({
			auth,
			organizationId,
			estimateId,
			body: zohoInvoiceUtils.compact({
				address: propsValue.address ?? address?.address,
				city: propsValue.city ?? address?.city,
				state: propsValue.state ?? address?.state,
				zip: propsValue.zip ?? address?.zip,
				country: propsValue.country ?? address?.country,
				fax: propsValue.fax ?? address?.fax,
			}),
		});
	},
});
