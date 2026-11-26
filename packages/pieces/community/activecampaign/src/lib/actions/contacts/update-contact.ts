import { activeCampaignAuth } from '../../auth';
import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { updateContactOutputSchema } from '../../common/output-schemas';
import { CreateContactRequest } from '../../common/types';

export const updateContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_contact',
	classification: 'WRITE',
	displayName: 'Update Contact',
	description: "Updates a contact's details and custom fields.",
	audience: 'human',
	aiMetadata: { description: 'Updates an existing ActiveCampaign contact identified by contact ID, changing its email, name, phone, and/or custom field values. Use when you already have the contact ID and want to modify its details. Idempotent: re-running with the same input leaves the contact in the same state.', idempotent: true },
	outputSchema: updateContactOutputSchema,
	props: {
		contactId: activecampaignCommon.contactId,
		emptyFieldsNote: Property.MarkDown({
			value: 'Fields left empty keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
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
			label: 'Contact to Update',
			icon: 'user',
			props: ['contactId', 'emptyFieldsNote'],
		},
		{
			key: 'changes',
			display: 'section',
			label: 'Changes',
			icon: 'text',
			props: ['email', 'firstName', 'lastName', 'phone', 'contactCustomFields'],
		},
	],
	async run(context) {
		const { email, contactId, firstName, lastName, phone, contactCustomFields } =
			context.propsValue;

		const updateContactParams: Partial<CreateContactRequest> = {
			...(hasValue({ value: email }) ? { email } : {}),
			...(hasValue({ value: firstName }) ? { firstName } : {}),
			...(hasValue({ value: lastName }) ? { lastName } : {}),
			...(hasValue({ value: phone }) ? { phone } : {}),
			fieldValues: Object.entries(contactCustomFields ?? {})
				.filter(([, value]) => hasValue({ value }))
				.map(([key, value]) => ({ field: key, value })),
		};

		const client = makeClient(context.auth.props);
		return await client.updateContact({ contactId, contact: updateContactParams });
	},
});

function hasValue({ value }: { value: unknown }): boolean {
	if (value === undefined || value === null || value === '') {
		return false;
	}
	return !(Array.isArray(value) && value.length === 0);
}
