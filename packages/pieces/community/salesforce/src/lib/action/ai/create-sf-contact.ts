import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createSfContactOutputSchema } from '../../output-schemas';

export const createSfContact = createAction({
	auth: salesforceAuth,
	name: 'create_sf_contact',
	classification: 'WRITE',
	displayName: 'Create Contact',
	description: 'Create a new contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Contact with a required Last Name and optional name, email, phones, title, department, account link, mailing location, lead source and owner; custom fields go in Additional Fields. Use Search Contacts first to avoid duplicates and Update Contact to change an existing one; for unqualified prospects use Create Lead instead. Not idempotent: each call creates a new Contact.',
		idempotent: false,
	},
	outputSchema: createSfContactOutputSchema,
	props: {
		LastName: Property.ShortText({ displayName: 'Last Name', required: true }),
		FirstName: Property.ShortText({ displayName: 'First Name', required: false }),
		Email: Property.ShortText({ displayName: 'Email', required: false }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		MobilePhone: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
		Title: Property.ShortText({ displayName: 'Title', required: false }),
		Department: Property.ShortText({ displayName: 'Department', required: false }),
		AccountId: Property.ShortText({ displayName: 'Account ID', required: false }),
		MailingCity: Property.ShortText({ displayName: 'Mailing City', required: false }),
		MailingCountry: Property.ShortText({ displayName: 'Mailing Country', required: false }),
		LeadSource: Property.ShortText({ displayName: 'Lead Source', description: 'Lead source picklist value, e.g. Web.', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { additional_fields, ...fields } = context.propsValue;
		const result = await crmUtils.createRecord({ auth: context.auth, object: 'Contact', fields, additionalFields: additional_fields });
		return { ...result, last_name: fields.LastName, email: fields.Email ?? null };
	},
});
