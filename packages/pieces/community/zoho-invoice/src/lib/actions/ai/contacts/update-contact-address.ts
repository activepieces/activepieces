import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceAddressInfoOutputSchema } from '../../../output-schemas';

export const updateContactAddressAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_contact_address',
	outputSchema: zohoInvoiceAddressInfoOutputSchema,
	displayName: 'Update Contact Address',
	description: 'Changes an additional address of a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one additional address of a contact; fields left empty keep their current value. Use List Contact Addresses to find the address ID. For the billing or shipping address use Update Contact.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		addressId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Address ID',
			description: 'Additional address ID. Use List Contact Addresses to find it.',
		}),
		attention: Property.ShortText({
			displayName: 'Attention',
			description: 'Name of the person the address is for. Empty = unchanged.',
			required: false,
		}),
		address: Property.ShortText({
			displayName: 'Street',
			description: 'Street address, first line. Empty = unchanged.',
			required: false,
		}),
		street2: Property.ShortText({
			displayName: 'Street 2',
			description: 'Street address, second line. Empty = unchanged.',
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
			description: 'Postal code. Empty = unchanged.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'Country name. Empty = unchanged.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number. Empty = unchanged.',
			required: false,
		}),
		fax: Property.ShortText({
			displayName: 'Fax',
			description: 'Fax number. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateContactAddress({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			addressId: propsValue.addressId,
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
