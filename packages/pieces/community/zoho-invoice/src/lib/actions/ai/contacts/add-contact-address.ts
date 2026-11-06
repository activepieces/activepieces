import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceAddressInfoOutputSchema } from '../../../output-schemas';

export const addContactAddressAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_contact_address',
	outputSchema: zohoInvoiceAddressInfoOutputSchema,
	displayName: 'Add Contact Address',
	description: 'Adds an additional address to a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an extra address to a contact, beside its billing and shipping addresses (change those with Update Contact). Use List Contacts to find the contact ID. Not idempotent: each call adds a new address.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		attention: Property.ShortText({
			displayName: 'Attention',
			description: 'Name of the person the address is for.',
			required: false,
		}),
		address: Property.ShortText({
			displayName: 'Street',
			description: 'Street address, first line.',
			required: false,
		}),
		street2: Property.ShortText({
			displayName: 'Street 2',
			description: 'Street address, second line.',
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
			description: 'Postal code.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country name.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		fax: Property.ShortText({ displayName: 'Fax', description: 'Fax number.', required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addContactAddress({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			body: zohoInvoiceUtils.compact({
				attention: propsValue.attention,
				address: propsValue.address,
				street2: propsValue.street2,
				city: propsValue.city,
				state: propsValue.state,
				zip: propsValue.zip,
				country: propsValue.country,
				phone: propsValue.phone,
				fax: propsValue.fax,
			}),
		});
	},
});
