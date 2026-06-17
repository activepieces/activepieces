import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { CreateContactRequest } from '../../common/types';

export const updateContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_contact',
	displayName: 'Update Contact',
	description: 'Updates an existing contact.',
	audience: 'both',
	aiMetadata: { description: 'Updates an existing ActiveCampaign contact identified by contact ID, changing its email, name, phone, and/or custom field values. Use when you already have the contact ID and want to modify its details. Idempotent: re-running with the same input leaves the contact in the same state.', idempotent: true },
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

		const client = makeClient(context.auth.props);
		return await client.updateContact(Number(contactId), updateContactParams);
	},
});
