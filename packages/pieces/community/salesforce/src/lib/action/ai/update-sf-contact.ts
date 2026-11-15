import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateSfContact = createAction({
	auth: salesforceAuth,
	name: 'update_sf_contact',
	classification: 'WRITE',
	displayName: 'Update Contact',
	description: 'Update fields on an existing contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Contact by id; only the fields you supply change, the rest stay as they are. Set Account ID to move the contact to another account. Use Create Contact for new people and Search Contacts to find the id. At least one field is required; custom fields go in Additional Fields (null clears a value). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
		LastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		FirstName: Property.ShortText({ displayName: 'First Name', required: false }),
		Email: Property.ShortText({ displayName: 'Email', required: false }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		MobilePhone: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
		Title: Property.ShortText({ displayName: 'Title', required: false }),
		Department: Property.ShortText({ displayName: 'Department', required: false }),
		AccountId: Property.ShortText({ displayName: 'Account ID', required: false }),
		MailingCity: Property.ShortText({ displayName: 'Mailing City', required: false }),
		MailingCountry: Property.ShortText({ displayName: 'Mailing Country', required: false }),
		LeadSource: Property.ShortText({ displayName: 'Lead Source', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { contact_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({ auth: context.auth, object: 'Contact', recordId: contact_id, fields, additionalFields: additional_fields });
	},
});
