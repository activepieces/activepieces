import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { createContactOutputSchema } from '../../common/output-schemas';
import { CreateContactRequest } from '../../common/types';

export const createContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_contact',
	classification: 'WRITE',
	displayName: 'Create Contact',
	description: 'Creates a contact. Fails if the email is already in use.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new ActiveCampaign contact from an email (required) plus optional first name, last name, phone, and custom field values. Use when adding a new person to the CRM. Not idempotent: it never updates, and a repeat with an email that already exists fails with ActiveCampaign\'s 422 duplicate error.', idempotent: false },
	outputSchema: createContactOutputSchema,
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
			placeholder: 'jane@example.com',
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: false,
			width: 'half',
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: false,
			width: 'half',
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
			placeholder: '+1 555 123 4567',
		}),
		contactCustomFields: activecampaignCommon.contactCustomFields,
	},
	propertyGroups: [
		{
			key: 'contact',
			display: 'section',
			label: 'Contact',
			icon: 'user',
			props: ['email', 'firstName', 'lastName', 'phone', 'contactCustomFields'],
		},
	],
	async run(context) {
		const { email, firstName, lastName, phone, contactCustomFields } = context.propsValue;

		const createContactParams: CreateContactRequest = {
			email,
			firstName,
			lastName,
			phone,
			fieldValues: [],
		};

		Object.entries(contactCustomFields ?? {}).forEach(([key, value]) => {
			createContactParams.fieldValues.push({ field: key, value: value });
		});

		const client = makeClient(context.auth.props);
		return await client.createContact(createContactParams);
	},
});
