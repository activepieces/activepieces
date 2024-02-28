import { activeCampaignAuth } from '../../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateContactRequest } from '../../common/types';

export const createContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_contact',
	displayName: 'Create Contact',
	description: 'Creates a new contact.',
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

		const client = makeClient(context.auth);
		return await client.createContact(createContactParams);
	},
});
