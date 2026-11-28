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
	description: 'Creates a new contact.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new ActiveCampaign contact from an email (required) plus optional first name, last name, phone, and custom field values. Use when adding a new person to the CRM. Not idempotent: it never updates, and a repeat with an email that already exists fails with ActiveCampaign\'s 422 duplicate error.', idempotent: false },
	outputSchema: createContactOutputSchema,
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			required: false,
		}),
		contactCustomFields: activecampaignCommon.contactCustomFields,
	},
	async run(context) {
		const { email, firstName, lastName, phone, contactCustomFields } = context.propsValue;

		const createContactParams: CreateContactRequest = {
			email,
			firstName,
			lastName,
			phone,
			fieldValues: [],
		};

		Object.entries(contactCustomFields).forEach(([key, value]) => {
			createContactParams.fieldValues.push({ field: key, value: value });
		});

		const client = makeClient(context.auth.props);
		return await client.createContact(createContactParams);
	},
});
