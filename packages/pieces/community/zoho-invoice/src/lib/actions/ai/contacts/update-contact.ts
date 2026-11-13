import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceContactOutputSchema } from '../../../output-schemas';

export const updateContactAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_contact',
	outputSchema: zohoInvoiceContactOutputSchema,
	displayName: 'Update Contact',
	description: "Changes a customer contact's details.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on a contact; fields left empty keep their current value. Use List Contacts to find the ID. To change contact persons use Update Contact Person, and for extra addresses use Update Contact Address.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		contactName: Property.ShortText({
			displayName: 'Contact Name',
			description: 'New display name. Empty = unchanged.',
			required: false,
		}),
		companyName: Property.ShortText({
			displayName: 'Company Name',
			description: 'New company name. Empty = unchanged.',
			required: false,
		}),
		currencyId: zohoInvoiceAiProps.currencyId({
			required: false,
			description: 'New currency ID. Use List Currencies to find it. Empty = unchanged.',
		}),
		paymentTerms: Property.Number({
			displayName: 'Payment Terms',
			description: 'New net payment terms in days. Empty = unchanged.',
			required: false,
		}),
		website: Property.ShortText({
			displayName: 'Website',
			description: 'New website. Empty = unchanged.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'New internal notes. Empty = unchanged.',
			required: false,
		}),
		billingAddress: Property.Json({
			displayName: 'Billing Address',
			description:
				'New billing address as a JSON object with keys attention, address, street2, city, state, zip, country, fax, phone. Empty = unchanged.',
			required: false,
		}),
		shippingAddress: Property.Json({
			displayName: 'Shipping Address',
			description:
				'New shipping address as a JSON object with keys attention, address, street2, city, state, zip, country, fax, phone. Empty = unchanged.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		const { organizationId, contactId } = propsValue;
		const current = await zohoInvoiceApi.getContact({ auth, organizationId, contactId });
		return await zohoInvoiceApi.updateContact({
			auth,
			organizationId,
			contactId,
			body: {
				...zohoInvoiceUtils.compact({ contact_name: current.contact?.contact_name }),
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					contact_name: propsValue.contactName,
					company_name: propsValue.companyName,
					currency_id: propsValue.currencyId,
					payment_terms: propsValue.paymentTerms,
					website: propsValue.website,
					notes: propsValue.notes,
					billing_address: propsValue.billingAddress,
					shipping_address: propsValue.shippingAddress,
				}),
			},
		});
	},
});
