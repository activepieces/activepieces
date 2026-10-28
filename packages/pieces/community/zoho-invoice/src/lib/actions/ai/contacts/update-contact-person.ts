import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceContactPersonOutputSchema } from '../../../output-schemas';

export const updateContactPersonAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_contact_person',
	outputSchema: zohoInvoiceContactPersonOutputSchema,
	displayName: 'Update Contact Person',
	description: "Changes a contact person's details.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on a contact person; fields left empty keep their current value. Use List Contacts for the contact ID and List Contact Persons for the person ID. Enabling portal access sends a real invitation email.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		contactPersonId: zohoInvoiceAiProps.contactPersonId({ required: true }),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'First name. Empty = unchanged.',
			required: false,
		}),
		salutation: Property.ShortText({
			displayName: 'Salutation',
			description: 'Salutation, e.g. Mr. or Ms. Empty = unchanged.',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Last name. Empty = unchanged.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address. Empty = unchanged.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Work phone number. Empty = unchanged.',
			required: false,
		}),
		mobile: Property.ShortText({
			displayName: 'Mobile',
			description: 'Mobile phone number. Empty = unchanged.',
			required: false,
		}),
		skype: Property.ShortText({
			displayName: 'Skype',
			description: 'Skype ID. Empty = unchanged.',
			required: false,
		}),
		designation: Property.ShortText({
			displayName: 'Designation',
			description: 'Job title. Empty = unchanged.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department',
			description: 'Department. Empty = unchanged.',
			required: false,
		}),
		enablePortal: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Enable Portal',
			description:
				'Turn client portal access on or off. Yes emails an invitation. Empty = unchanged.',
		}),
	},
	async run({ auth, propsValue }) {
		const { organizationId, contactId, contactPersonId } = propsValue;
		const current = await zohoInvoiceApi.getContactPerson({
			auth,
			organizationId,
			contactId,
			contactPersonId,
		});
		const person = current.contact_person;
		return await zohoInvoiceApi.updateContactPerson({
			auth,
			organizationId,
			contactPersonId,
			body: zohoInvoiceUtils.compact({
				contact_id: contactId,
				first_name: propsValue.firstName ?? person?.first_name,
				salutation: propsValue.salutation ?? person?.salutation,
				last_name: propsValue.lastName ?? person?.last_name,
				email: propsValue.email ?? person?.email,
				phone: propsValue.phone ?? person?.phone,
				mobile: propsValue.mobile ?? person?.mobile,
				skype: propsValue.skype ?? person?.skype,
				designation: propsValue.designation ?? person?.designation,
				department: propsValue.department ?? person?.department,
				enable_portal: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.enablePortal }),
			}),
		});
	},
});
