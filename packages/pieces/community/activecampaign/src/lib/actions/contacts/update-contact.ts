import { activeCampaignAuth } from '../../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateContactRequest } from '../../common/types';

export const updateContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_contact',
	displayName: 'Update Contact',
	description: 'Updates an existing contact.',
	props: {
		contactId: activecampaignCommon.contactId,
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
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
		const { email, contactId, firstName, lastName, phone, contactCustomFields } =
			context.propsValue;

		const updateContactParams: Partial<CreateContactRequest> = {
			email,
			firstName,
			lastName,
			phone,
			fieldValues: [],
		};

		Object.entries(contactCustomFields).forEach(([key, value]) => {
			updateContactParams.fieldValues?.push({ field: key, value: value });
		});

		const client = makeClient(context.auth);
		return await client.updateContact(Number(contactId), updateContactParams);
	},
});
