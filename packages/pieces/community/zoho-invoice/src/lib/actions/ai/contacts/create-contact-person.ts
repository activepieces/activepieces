import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceContactPersonOutputSchema } from '../../../output-schemas';

export const createContactPersonAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_contact_person',
	outputSchema: zohoInvoiceContactPersonOutputSchema,
	displayName: 'Create Contact Person',
	description: 'Adds a person to a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a contact person (name, email, phones, job) to a contact. Use List Contacts to find the contact ID. Enabling portal access sends the person a real invitation email. Not idempotent: each call adds a new person.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'First name.',
			required: true,
		}),
		salutation: Property.ShortText({
			displayName: 'Salutation',
			description: 'Salutation, e.g. Mr. or Ms.',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Last name.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Work phone number.',
			required: false,
		}),
		mobile: Property.ShortText({
			displayName: 'Mobile',
			description: 'Mobile phone number.',
			required: false,
		}),
		skype: Property.ShortText({
			displayName: 'Skype',
			description: 'Skype ID.',
			required: false,
		}),
		designation: Property.ShortText({
			displayName: 'Designation',
			description: 'Job title.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department',
			description: 'Department.',
			required: false,
		}),
		enablePortal: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Enable Portal',
			description: 'Give the person client portal access and email them an invitation. Empty = no.',
		}),
		additionalFields: zohoInvoiceAiProps.additionalFields({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createContactPerson({
			auth,
			organizationId: propsValue.organizationId,
			body: {
				...(propsValue.additionalFields ?? {}),
				...zohoInvoiceUtils.compact({
					contact_id: propsValue.contactId,
					first_name: propsValue.firstName,
					salutation: propsValue.salutation,
					last_name: propsValue.lastName,
					email: propsValue.email,
					phone: propsValue.phone,
					mobile: propsValue.mobile,
					skype: propsValue.skype,
					designation: propsValue.designation,
					department: propsValue.department,
					enable_portal: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.enablePortal }),
				}),
			},
		});
	},
});
