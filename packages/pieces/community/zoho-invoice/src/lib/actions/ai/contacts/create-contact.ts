import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceContactOutputSchema } from '../../../output-schemas';

export const createContactAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_contact',
	outputSchema: zohoInvoiceContactOutputSchema,
	displayName: 'Create Contact',
	description: 'Creates a customer contact in Zoho Invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a customer contact, optionally with contact persons and billing/shipping addresses. Not idempotent: each call creates a new contact, so use List Contacts first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactName: Property.ShortText({
			displayName: 'Contact Name',
			description: 'Display name of the contact.',
			required: true,
		}),
		companyName: Property.ShortText({
			displayName: 'Company Name',
			description: 'Company name of the contact.',
			required: false,
		}),
		currencyId: zohoInvoiceAiProps.currencyId({
			required: false,
			description:
				'Currency ID for the contact. Use List Currencies to find it. Empty = base currency.',
		}),
		paymentTerms: Property.Number({
			displayName: 'Payment Terms',
			description: 'Net payment terms in days, e.g. 15.',
			required: false,
		}),
		website: Property.ShortText({
			displayName: 'Website',
			description: 'Website of the contact.',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Internal notes about the contact.',
			required: false,
		}),
		contactPersons: Property.Array({
			displayName: 'Contact Persons',
			description: 'People at this contact. The first one becomes the primary contact person.',
			required: false,
			properties: {
				salutation: Property.ShortText({ displayName: 'Salutation', required: false }),
				firstName: Property.ShortText({ displayName: 'First Name', required: false }),
				lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
				email: Property.ShortText({ displayName: 'Email', required: false }),
				phone: Property.ShortText({ displayName: 'Phone', required: false }),
				mobile: Property.ShortText({ displayName: 'Mobile', required: false }),
			},
		}),
		billingAddress: Property.Json({
			displayName: 'Billing Address',
			description:
				'Billing address as a JSON object with keys attention, address, street2, city, state, zip, country, fax, phone.',
			required: false,
		}),
		shippingAddress: Property.Json({
			displayName: 'Shipping Address',
			description:
				'Shipping address as a JSON object with keys attention, address, street2, city, state, zip, country, fax, phone.',
			required: false,
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createContact({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					contact_name: propsValue.contactName,
					company_name: propsValue.companyName,
					currency_id: propsValue.currencyId,
					payment_terms: propsValue.paymentTerms,
					website: propsValue.website,
					notes: propsValue.notes,
					contact_persons: propsValue.contactPersons?.map((person) => toContactPerson({ person })),
					billing_address: propsValue.billingAddress,
					shipping_address: propsValue.shippingAddress,
				}),
			},
		});
	},
});

function toContactPerson({ person }: { person: unknown }): Record<string, unknown> {
	const fields: Record<string, unknown> =
		typeof person === 'object' && person !== null ? Object.fromEntries(Object.entries(person)) : {};
	return zohoInvoiceUtils.compact({
		salutation: fields['salutation'],
		first_name: fields['firstName'],
		last_name: fields['lastName'],
		email: fields['email'],
		phone: fields['phone'],
		mobile: fields['mobile'],
	});
}
